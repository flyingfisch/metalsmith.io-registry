import flashheart from 'flashheart'
import vow from 'vow'
import debug from 'debug'
import config from 'config'
import streamToWorker from './streamToWorker'
import {
  writeFileSync as write
} from 'fs'
import ProgressBar from 'progress'

const OUTPUT_PATH = 'pluginRegistry.json'

const dbg = debug('metalsmith-registry')

// initialise disabled progress
let progress = getProgress()

// create output structure
const output = {
  packages: [],
  keywords: {}
}

// create clients
const npmjsClient = getNpmjsClient()
const githubClient = getGithubClient()

// [streamToWorker](./streamToWorker.js.html) supervises iteration
streamToWorker({
  fetch,
  worker,
  concurrency: 10,
  highWaterMark: 30
})
.then(() => {
  writeJson()
  dbg('scrape complete')
})
.catch((err) => dbg(err))

/**
 * ## fetch
 * get items from npmjs search endpoint
 *
 * @param {Number} retrieved - items retrieved thus far
 * @param {Function} callback - return retrieved items
 */
function fetch (retrieved, callback) {
  npmjsClient.get(
    'https://registry.npmjs.org/-/v1/search',
    {qs: {text: 'metalsmith-', from: retrieved}},
    (err, res) => {
      if (err) throw err
      let npmjs = res.objects.map((resObject) => resObject.package)
      // instantiate progress bar now we know the total packages
      if (retrieved === 0 && !/no-progress/.exec(process.env.DEBUG)) {
        progress = getProgress(res.total)
      }
      // check whether that was the last request
      if (retrieved + res.objects.length >= res.total) npmjs.push(null)
      callback(null, npmjs)
    }
  )
}

/**
 * ## worker
 * called for each result from npmjs search
 * each function:
 *  - in the queue receives meta as a single param.
 *  - must return a promise, but that promise does not need to resolve to meta
 *  - can reject it's returned promise to discontinue processing that item
 *
 * @param {Object} npmjs - one result from npmjs search
 * @param {Function} retry - pass an item to retry to restart the process
 * @return {Promise}
 */
function worker (npmjs, retry) {
  let meta = {
    npmjs,
    github: {}
  }
  return vow.resolve()
  .then(() => filter(meta))
  .then(() => getDownloads(meta))
  .then(() => getGithub(meta))
  .then(() => getIssues(meta))
  .then(() => parse(meta))
  .catch((err) => {
    progress.interrupt(err.toString ? err.toString() : err)
  })
  .then(() => {
    progress.tick({ name: meta.npmjs.name })
  })
  .catch(dbg)
}

/**
 * ## filter
 * exclude results from npmjs
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function filter (meta) {
  if (/^(@[a-zA-Z]+\/)?metalsmith-/.exec(meta.npmjs.name)) return
  return vow.reject(`ignoring ${meta.npmjs.name}`)
}

/**
 * ## getNpmjs
 * the search endpoint returns a subset of package meta. This endpoint returns
 * all available meta. This additional data isn't used at this time.
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function getNpmjs (meta) {
  let defer = vow.defer()
  npmjsClient.get(
    `https://registry.npmjs.org/${meta.npmjs.name}`,
    (err, res) => {
      dbg(err)
      dbg(res)
      defer.resolve()
    }
  )
  return defer.promise()
}

/**
 * ## getDownloads
 * npmjs downloads need to be retrieved from the `downloads` endpoint
 * this just retrieves downloads during the last month
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function getDownloads (meta) {
  let defer = vow.defer()
  npmjsClient.get(
    `https://api.npmjs.org/downloads/point/last-month/${meta.npmjs.name}`,
    (err, res) => {
      if (err) return defer.reject(err)
      meta.npmjs.downloads = res.downloads
      defer.resolve()
    }
  )
  return defer.promise()
}

/**
 * ## getGithub
 * retrieve package meta from github see structure here:
 * https://developer.github.com/v3/repos/#get
 * response doesn't include loads of information, but includes a lot of urls
 * with with which to retrieve additional meta. See `getIssues`
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function getGithub (meta) {
  const repo = /[^/]*\/[^/]*$/.exec(meta.npmjs.links.repository)
  if (!repo) return vow.reject(`${meta.npmjs.name}: has no repo link`)
  let defer = vow.defer()
  githubClient.get(
    `https://api.github.com/repos/${repo[0]}`,
    (err, res) => {
      if (err && err.statusCode === 404) {
        return defer.reject(`${meta.npmjs.name}: has bad repo link`)
      }
      if (err) {
        return defer.reject(err)
      }
      meta.github = res
      defer.resolve()
    }
  )
  return defer.promise()
}

/**
 * ## getIssues
 * retrieve number of issues
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function getIssues (meta) {
  let defer = vow.defer()
  let url = meta.github.issues_url.replace(/\{.*\}/, '')
  githubClient.get(
    url,
    (err, res) => {
      if (err) return defer.reject(err)
      meta.github.issues_count = res.length
      defer.resolve()
    }
  )
  return defer.promise()
}

/**
 * ## parse
 * construct object to be output, exclude all the information not required
 * by the client
 *
 * @param {object} meta - see worker
 * @return {Promise}
 */
function parse (meta) {
  // dbg(meta)
  const kws = output.keywords
  const pkgs = output.packages
  let pkg = {
    name: meta.npmjs.name,
    keywords: meta.npmjs.keywords,
    description: meta.npmjs.description,
    stars: meta.github.stargazers_count,
    issues: meta.github.issues_count,
    downloads: meta.npmjs.downloads
  }
  pkgs.push(pkg)
  if (!pkg.keywords) return
  pkg.keywords.forEach((kw) => {
    kws[kw] = kws[kw] === undefined ? 1 : kws[kw] + 1
  })
  return pkg
}

/**
 * ## writeJson
 * write collated meta to JSON
 */
function writeJson () {
  write(OUTPUT_PATH, JSON.stringify(output))
  dbg('scrape complete')
}

/**
 * ## getProgress
 * make progress bar, or disabled noop thing
 *
 * @param {Number} total - total items
 * @return {Object|ProgressBar}
 */
function getProgress (total) {
  if (!total) {
    // initialise disabled progress bar
    return {
      tick: () => {},
      interrupt: (...args) => dbg(...args)
    }
  }
  return new ProgressBar(
    '[:bar] :current/:total (:elapsed/:eta) :name',
    {
      incomplete: ' ',
      total,
      width: 50
    }
  )
}

/**
 * ## getNpmjsClient
 * create client for npmjs
 *
 * @return {Request}
 */
function getNpmjsClient () {
  return flashheart.createClient({
    retries: 5,
    retryTimeout: 250,
    timeout: 5000
  })
}

/**
 * ## getGithubClient
 * create client for github
 * configure auth for either token or user & pass.
 * see `config/default.js`
 *
 * @return {Request}
 */
function getGithubClient () {
  const githubAuth = config.get('github-auth')
  const githubDefaults = {}
  if (githubAuth.token) {
    githubDefaults.headers = {Authorization: `token ${githubAuth.token}`}
  } else if (githubAuth.username) {
    githubDefaults.auth = githubAuth
  } else {
    throw new Error('fix your github auth config')
  }
  return flashheart.createClient({
    retries: 5,
    retryTimeout: 250,
    timeout: 5000,
    defaults: githubDefaults
  })
}

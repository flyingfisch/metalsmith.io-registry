import flashheart from 'flashheart'
import vow from 'vow'
import debug from 'debug'
import config from 'config'
import streamToWorker from './streamToWorker'
import {
  writeFileSync as write,
  existsSync as exists,
  mkdirSync as mkdir
} from 'fs'
import ProgressBar from 'progress'

const OUTPUT_PATH = 'pluginRegistry.json'

const dbg = debug('registry')

// initialise disabled progress bar
let progress = {
  tick: () => {},
  interrupt: (...args) => dbg(...args)
}

const output = {
  packages: [],
  keywords: {}
}
const npmjsClient = flashheart.createClient({
  retries: 5,
  retryTimeout: 250,
  timeout: 5000
})
const githubClient = flashheart.createClient({
  retries: 5,
  retryTimeout: 250,
  timeout: 5000,
  defaults: {auth: config.get('githubCredentials')}
})

streamToWorker({
  fetch,
  worker,
  concurrency: 10,
  highWaterMark: 30
})
.then(() => end())
.catch((err) => dbg(err))

function fetch (retrieved, callback) {
  npmjsClient.get(
    'https://registry.npmjs.org/-/v1/search',
    {qs: {text: 'metalsmith-', from: retrieved}},
    (err, res) => {
      if (err) throw err
      let npmjs = res.objects.map((resObject) => resObject.package)
      // instantiate progress bar now we know the total packages
      if (retrieved === 0 && !/no-progress/.exec(process.env.DEBUG)) {
        makeProgressBar(res.total)
      }
      // check whether that was the last request
      if (retrieved + res.objects.length >= res.total) npmjs.push(null)
      callback(null, npmjs)
    }
  )
}

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
    let message = err.toString ? err.toString() : err
    progress.interrupt(message)
  })
  .then(() => {
    progress.tick({ name: meta.npmjs.name })
  })
  .catch(dbg)
}

function end () {
  write(OUTPUT_PATH, JSON.stringify(output))
  dbg('scrape complete')
}

function makeProgressBar (total) {
  progress = new ProgressBar(
    '[:bar] :current/:total (:elapsed/:eta) :name',
    {
      incomplete: ' ',
      total,
      width: 50
    }
  )
}

function filter (meta) {
  if (/^(@[a-zA-Z]+\/)?metalsmith-/.exec(meta.npmjs.name)) return
  return vow.reject(`ignoring ${meta.npmjs.name}`)
}

// this works but pulls down a lot of data which isn't useful at this time
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

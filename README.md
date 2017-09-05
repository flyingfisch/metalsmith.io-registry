### metalsmith.io-registry

A quick proof of concept of how a plugin registry might work.

### usage

 * clone repo
 * copy `config/default.js` to `config/local.js` and enter your credentials
 * `npm i`
 * `npm run scrape` to collate package meta data
 * `npm run build` to build static client
 * `npm run serve` to run dev server
 * direct your browser to http://localhost:8080

### docs

See [annotated source](https://leviwheatcroft.github.io/metalsmith.io-registry/)

Generate docs with `npm run docs && npm run gh-pages`

### dev notes

For both the npmjs & github apis it will be best to use a simple request client
rather than their respective api abstraction packages. Our uses are relatively
simple, and I ran into weird problems trying to trap errors with the published
github api package.

Npmjs api docs are really well hidden, this is the best I can find:
https://github.com/npm/registry/blob/master/docs/

`npm run scrape:dev` disables the progress bar which is very helpful of you're
debugging things to the console.

The package meta data file is ~$100kb on disk, but gzip will compress this to
about 20kb.

The client js currently generated is currently ~850kb, but there's no crazy
dependencies or whatever so this should come down to less than 200kb when
built in production mode.. but I haven't tried it.

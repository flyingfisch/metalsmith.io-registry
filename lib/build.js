import Metalsmith from 'metalsmith'
import debug from 'debug'
import {
  resolve
} from 'path'
import ignore from 'metalsmith-ignore'
import pug from 'metalsmith-pug'
import webpack from 'metalsmith-webpack-2'

const dbg = debug('registry')
const baseDir = resolve(__dirname, '..')

/**
 * ## Metalsmith build
 * simple ms procedure to build the client
 * I couldn't get webpack to work here so I'm doing that externally.
 */
Metalsmith(baseDir)
.source(resolve(baseDir, 'lib', 'client'))
.destination(resolve(baseDir, 'dist'))
.use(webpack())
.use(pug({ useMetadata: true }))
.use(ignore([
  // 'styles.less',
  '**/*.jsx',
  '**/*.less',
  '**/*.pug'
]))

.build((err) => {
  if (err) dbg(err)
  else dbg('done')
})

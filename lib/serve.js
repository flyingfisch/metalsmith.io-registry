import debug from 'debug'
import http from 'http'
import st from 'st'

const dbg = debug('registry')
const PORT = 8080

let server = st({
  path: 'dist',
  index: 'index.html'
})

http.createServer((request, response) => {
  server(request, response)
  dbg(`req: ${request.url.slice(1)}`)
})
.listen(PORT, () => dbg(`listening at http://localhost:${PORT}`))

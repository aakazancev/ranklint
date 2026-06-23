import { createServer } from 'node:http'

const port = Number(process.env.PORT)
createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/plain' })
  res.end('ok')
}).listen(port, '127.0.0.1')

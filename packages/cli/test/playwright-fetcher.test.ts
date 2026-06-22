import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { PlaywrightFetcher } from '../src/playwright-fetcher'

const ssrPage = `<!doctype html><html><head><title>SSR title</title></head><body>
<h1>Rendered on the server</h1>
<a href="/next">next</a>
<script>const p = document.createElement('p'); p.id = 'hydrated'; document.body.append(p)</script>
</body></html>`

let server: Server
let base: string
const fetcher = new PlaywrightFetcher()

beforeAll(async () => {
  server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(ssrPage)
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(async () => {
  await fetcher.close()
  await new Promise<void>(r => server.close(() => r()))
})

describe('PlaywrightFetcher', () => {
  it('captures ssrHtml before hydration and html after', async () => {
    const snap = await fetcher.fetch(`${base}/`)
    expect(snap.statusCode).toBe(200)
    expect(snap.ssrHtml).toContain('Rendered on the server')
    expect(snap.ssrHtml).not.toContain('<p id="hydrated">')
    expect(snap.html).toContain('<p id="hydrated">')
    expect(snap.links).toEqual([{ href: '/next', text: 'next', rel: undefined }])
    expect(snap.ttfb).toBeGreaterThanOrEqual(0)
  }, 60_000)

  it('passes a custom user agent', async () => {
    let seenUa = ''
    server.removeAllListeners('request')
    server.on('request', (req, res) => {
      seenUa = req.headers['user-agent'] ?? ''
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(ssrPage)
    })
    await fetcher.fetch(`${base}/`, { userAgent: 'Googlebot-test' })
    expect(seenUa).toBe('Googlebot-test')
  }, 60_000)
})

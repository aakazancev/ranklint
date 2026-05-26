import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { HttpFetcher, parseLinks } from '../src/http-fetcher'

const page = `<!doctype html><html><head><title>T</title></head><body>
<a href="/about" rel="nofollow">About us</a>
<a href="https://ext.com/x">Ext</a>
</body></html>`

let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/missing') {
      res.writeHead(404, { 'content-type': 'text/html' })
      res.end('<html><body>nope</body></html>')
      return
    }
    res.writeHead(200, { 'content-type': 'text/html', 'x-test': 'yes' })
    res.end(page)
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('parseLinks', () => {
  it('extracts href, text and rel', () => {
    expect(parseLinks(page)).toEqual([
      { href: '/about', text: 'About us', rel: 'nofollow' },
      { href: 'https://ext.com/x', text: 'Ext', rel: undefined },
    ])
  })
})

describe('HttpFetcher', () => {
  const fetcher = new HttpFetcher()

  it('fetches a page snapshot', async () => {
    const snap = await fetcher.fetch(`${base}/`)
    expect(snap.statusCode).toBe(200)
    expect(snap.html).toContain('<title>T</title>')
    expect(snap.headers['x-test']).toBe('yes')
    expect(snap.ttfb).toBeGreaterThanOrEqual(0)
    expect(snap.links).toHaveLength(2)
    expect(snap.ssrHtml).toBeUndefined()
  })

  it('reports 404 status', async () => {
    const snap = await fetcher.fetch(`${base}/missing`)
    expect(snap.statusCode).toBe(404)
  })

  it('head returns status without body', async () => {
    const res = await fetcher.head(`${base}/`)
    expect(res.statusCode).toBe(200)
    expect(res.headers['x-test']).toBe('yes')
  })
})

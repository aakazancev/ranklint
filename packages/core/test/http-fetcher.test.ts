import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { authHeaders, HttpFetcher, parseLinks } from '../src/http-fetcher'

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

describe('authHeaders', () => {
  it('builds basic, cookie and custom headers', () => {
    const headers = authHeaders({
      basic: { username: 'stage', password: 's3cret' },
      cookies: [{ name: 'sid', value: 'abc' }, { name: 'env', value: 'uat' }],
      headers: { 'x-preview-key': 'k1' },
    })
    expect(headers.authorization).toBe(`Basic ${Buffer.from('stage:s3cret').toString('base64')}`)
    expect(headers.cookie).toBe('sid=abc; env=uat')
    expect(headers['x-preview-key']).toBe('k1')
    expect(authHeaders()).toEqual({})
  })
})

describe('HttpFetcher with auth', () => {
  it('sends auth on fetch and head against a protected server', async () => {
    const expected = `Basic ${Buffer.from('stage:s3cret').toString('base64')}`
    const guarded = createServer((req, res) => {
      if (req.headers.authorization !== expected || req.headers.cookie !== 'sid=abc') {
        res.writeHead(401)
        res.end()
        return
      }
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end('<html><body>ok</body></html>')
    })
    await new Promise<void>(r => guarded.listen(0, () => r()))
    const address = guarded.address()
    const url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/`

    const anonymous = new HttpFetcher()
    expect((await anonymous.fetch(url)).statusCode).toBe(401)

    const authed = new HttpFetcher({
      basic: { username: 'stage', password: 's3cret' },
      cookies: [{ name: 'sid', value: 'abc' }],
    })
    expect((await authed.fetch(url)).statusCode).toBe(200)
    expect((await authed.head(url)).statusCode).toBe(200)
    await new Promise<void>(r => guarded.close(() => r()))
  })
})

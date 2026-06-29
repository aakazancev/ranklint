import { createServer, type Server } from 'node:http'
import { HttpFetcher } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { runAudit } from '../src/run-audit'

const head = '<title>Zone fixture page with a long enough title</title>'
  + '<meta name="description" content="A zone fixture description that is long enough to satisfy the default seventy character minimum rule.">'

function page(canonicalPath: string, body: string, base: string): string {
  return `<html><head>${head}<link rel="canonical" href="${base}${canonicalPath}"></head>`
    + `<body><h1>Heading long enough for the zone fixture</h1>${body}</body></html>`
}

let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    const path = req.url?.split('?')[0] ?? '/'
    if (path === '/market' || path === '/market/deep' || path === '/other') {
      const body = path === '/market'
        ? `<a href="${base}/market/deep">deep</a><a href="${base}/other">main app</a>`
          + `<a href="${base}/dead">dead main link</a><a href="https://external.example/x">ext</a>`
        : '<p>leaf</p>'
      res.writeHead(200, { 'content-type': 'text/html' })
      res.end(page(path, body, base))
      return
    }
    res.writeHead(404, { 'content-type': 'text/html' })
    res.end('<html><body>not found</body></html>')
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('multi-app boundaries', () => {
  it('fully audits own zone, HEAD-checks foreign zone, stops at the boundary', async () => {
    const report = await runAudit({
      url: `${base}/market`,
      fetcher: new HttpFetcher(),
      config: {
        site: { url: base },
        apps: {
          self: { paths: ['/market/**'] },
          main: { paths: ['/**'], owner: 'external', checks: ['links:reachable'] },
        },
      },
    })

    expect(report.pages?.sort()).toEqual(['/market', '/market/deep'])

    const reachable = report.issues.filter(i => i.checkId === 'links:reachable')
    expect(reachable).toHaveLength(1)
    expect(reachable[0]?.url).toBe(`${base}/dead`)
    expect(reachable[0]?.message).toContain('404')
    expect(reachable[0]?.message).toContain('main')

    expect(report.crawlStats.external).toBe(1)
    expect(report.issues.filter(i => i.url === `${base}/other`)).toEqual([])
  })

  it('links:reachable can be switched off', async () => {
    const report = await runAudit({
      url: `${base}/market`,
      fetcher: new HttpFetcher(),
      config: {
        site: { url: base },
        apps: {
          self: { paths: ['/market/**'] },
          main: { paths: ['/**'], owner: 'external' },
        },
        rules: { 'links:reachable': 'off' },
      },
    })
    expect(report.issues.filter(i => i.checkId === 'links:reachable')).toEqual([])
  })
})

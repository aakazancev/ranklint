import { createServer, type Server } from 'node:http'
import type { CheckContext, PageSnapshot } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { noOrphans } from '../src/checks/links/orphans'
import { noDuplicateDescription, noDuplicateTitle, uniqueH1 } from '../src/checks/meta/duplicates'
import { stubFetcher } from '../src/test-utils'

function snap(path: string, html: string, siteUrl = 'https://x.com', statusCode = 200): PageSnapshot {
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => ({ href: m[1]!, text: 'x' }))
  return { url: `${siteUrl}${path}`, html, statusCode, headers: {}, ttfb: 1, links }
}

function ctx(pages: PageSnapshot[], siteUrl = 'https://x.com'): CheckContext {
  return {
    pages,
    config: { severity: 'error', options: {} },
    site: { url: siteUrl },
    fetcher: stubFetcher,
  }
}

describe('duplicate checks', () => {
  const dupTitle = '<html><head><title>Same title on both pages here</title></head><body><h1>Same heading text on both pages</h1></body></html>'

  it('flags each page sharing a title, description and h1', async () => {
    const pages = [snap('/a', dupTitle), snap('/b', dupTitle), snap('/c', '<html><head><title>Unique title</title></head><body><h1>Unique heading</h1></body></html>')]
    const titleIssues = await noDuplicateTitle.run(ctx(pages))
    expect(titleIssues).toHaveLength(2)
    expect(titleIssues[0]?.message).toContain('shared by 2 pages')
    expect(await uniqueH1.run(ctx(pages))).toHaveLength(2)
  })

  it('ignores non-200 snapshots and empty values', async () => {
    const pages = [snap('/a', dupTitle), snap('/404', dupTitle, 'https://x.com', 404), snap('/b', '<html></html>'), snap('/c', '<html></html>')]
    expect(await noDuplicateTitle.run(ctx(pages))).toEqual([])
    expect(await noDuplicateDescription.run(ctx(pages))).toEqual([])
  })
})

describe('links:no-orphans', () => {
  let server: Server
  let base: string

  beforeAll(async () => {
    server = createServer((req, res) => {
      if (req.url === '/sitemap.xml') {
        res.writeHead(200, { 'content-type': 'application/xml' })
        res.end(`<urlset><url><loc>${base}/</loc></url><url><loc>${base}/linked</loc></url><url><loc>${base}/orphan</loc></url></urlset>`)
        return
      }
      res.writeHead(404)
      res.end()
    })
    await new Promise<void>(r => server.listen(0, () => r()))
    const address = server.address()
    base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
  })

  afterAll(() => new Promise<void>(r => server.close(() => r())))

  it('flags sitemap pages without internal links, exempting root', async () => {
    const pages = [snap('/', `<a href="${base}/linked">go</a>`, base)]
    const issues = await noOrphans.run(ctx(pages, base))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.url).toBe(`${base}/orphan`)
  })
})

import type { CheckContext, PageFetcher, PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { sitemapNoNoindex, sitemapReachable } from '../src/checks/sitemap/sitemap'
import { stubFetcher } from '../src/test-utils'

function snap(path: string, overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: `https://x.com${path}`,
    html: '<html><head><title>Sitemap fixture page title</title></head><body></body></html>',
    statusCode: 200,
    headers: {},
    ttfb: 1,
    links: [],
    ...overrides,
  }
}

function fetcherWithSitemap(locs: string[], headStatuses: Record<string, number> = {}): PageFetcher {
  const xml = `<urlset>${locs.map(loc => `<url><loc>https://x.com${loc}</loc></url>`).join('')}</urlset>`
  return {
    ...stubFetcher,
    fetch: async url => ({ ...snap('/sitemap.xml'), url, html: xml }),
    head: async url => ({ statusCode: headStatuses[new URL(url).pathname] ?? 200, headers: {} }),
  }
}

function ctx(pages: PageSnapshot[], fetcher: PageFetcher): CheckContext {
  return {
    pages,
    config: { severity: 'error', options: {} },
    site: { url: 'https://x.com' },
    fetcher,
  }
}

describe('sitemap:no-noindex', () => {
  it('flags crawled sitemap pages that are noindex via meta or header', async () => {
    const pages = [
      snap('/a', { html: '<html><head><meta name="robots" content="noindex, follow"></head><body></body></html>' }),
      snap('/b', { headers: { 'x-robots-tag': 'noindex' } }),
      snap('/c'),
      snap('/not-in-sitemap', { html: '<html><head><meta name="robots" content="noindex"></head><body></body></html>' }),
    ]
    const issues = await sitemapNoNoindex.run(ctx(pages, fetcherWithSitemap(['/a', '/b', '/c'])))
    expect(issues.map(i => new URL(i.url).pathname).sort()).toEqual(['/a', '/b'])
  })

  it('passes when the sitemap is missing', async () => {
    const fetcher = { ...stubFetcher, fetch: async (url: string) => ({ ...snap('/sitemap.xml'), url, statusCode: 404 }) }
    expect(await sitemapNoNoindex.run(ctx([snap('/a')], fetcher))).toEqual([])
  })
})

describe('sitemap:reachable', () => {
  it('flags dead sitemap urls from crawl results and head probes', async () => {
    const pages = [snap('/ok'), snap('/gone', { statusCode: 404 })]
    const fetcher = fetcherWithSitemap(['/ok', '/gone', '/uncrawled-dead', '/uncrawled-ok'], {
      '/uncrawled-dead': 410,
      '/uncrawled-ok': 200,
    })
    const issues = await sitemapReachable.run(ctx(pages, fetcher))
    expect(issues.map(i => new URL(i.url).pathname).sort()).toEqual(['/gone', '/uncrawled-dead'])
    expect(issues.find(i => i.url.includes('gone'))?.message).toContain('404')
  })

  it('reports uncrawled urls beyond maxProbes as one issue', async () => {
    const locs = ['/a', '/b', '/c', '/d']
    const fetcher = fetcherWithSitemap(locs, { '/a': 404 })
    const context = { ...ctx([], fetcher), config: { severity: 'error' as const, options: { maxProbes: 2 } } }
    const issues = await sitemapReachable.run(context)
    const paths = issues.map(i => new URL(i.url).pathname)
    expect(paths).toContain('/a')
    expect(paths).toContain('/sitemap.xml')
    expect(issues.find(i => i.url.endsWith('/sitemap.xml'))?.message).toBe('Sitemap lists 2 URLs that were neither crawled nor probed (maxProbes: 2)')
  })

  it('probes everything with maxProbes 0', async () => {
    const locs = Array.from({ length: 150 }, (_, i) => `/p${i}`)
    const fetcher = fetcherWithSitemap(locs, { '/p149': 404 })
    const context = { ...ctx([], fetcher), config: { severity: 'error' as const, options: { maxProbes: 0 } } }
    const issues = await sitemapReachable.run(context)
    expect(issues.map(i => new URL(i.url).pathname)).toEqual(['/p149'])
  })
})

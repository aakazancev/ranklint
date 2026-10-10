import type { PageFetcher } from '@ranklint/core'
import { describe, expect, it, vi } from 'vitest'
import { runAudit } from '../src/run-audit'

function fakeFetcher(pages: Record<string, string>): PageFetcher {
  return {
    async fetch(url) {
      const html = pages[new URL(url).pathname] ?? ''
      return {
        url,
        html,
        statusCode: html ? 200 : 404,
        headers: {},
        ttfb: 1,
        links: [...html.matchAll(/href="([^"]+)"/g)].map(m => ({ href: m[1]!, text: 'x' })),
      }
    },
    async head() {
      return { statusCode: 200, headers: {} }
    },
    async close() {},
  }
}

describe('runAudit', () => {
  it('crawls, runs checks and reports issues with default config', async () => {
    const fetcher = fakeFetcher({
      '/': '<html><head><title>Home page title long enough to pass here</title></head><body><h1>Home heading long enough to pass</h1><a href="/broken-page">go</a></body></html>',
      '/broken-page': '<html><head><title>Another page title long enough right here</title></head><body><h1>a</h1><h1>b</h1></body></html>',
    })
    const report = await runAudit({ url: 'https://site.test/', cwd: '/tmp', fetcher })
    expect(report.meta.pagesAudited).toBe(2)
    const ids = new Set(report.issues.map(i => i.checkId))
    expect(ids).toContain('headings:single-h1')
    expect(ids).toContain('meta:description-required')
    expect(ids).toContain('canonical:required')
  })

  it('falls back to url origin when ranklint.config is absent', async () => {
    const fetcher = fakeFetcher({ '/': '<html></html>' })
    const report = await runAudit({ url: 'https://site.test/', cwd: '/tmp', fetcher })
    expect(report.meta.url).toBe('https://site.test')
  })

  it('seeds the crawl from crawl.entry paths instead of the base url', async () => {
    const fetcher = fakeFetcher({
      '/en/app': '<html><head><title>App page title long enough to pass</title></head><body><h1>App heading long enough here</h1></body></html>',
    })
    const report = await runAudit({
      url: 'https://site.test/',
      cwd: '/tmp',
      fetcher,
      config: { site: { url: 'https://site.test' }, crawl: { entry: ['/en/app'] } },
    })
    expect(report.meta.pagesAudited).toBe(1)
    expect(report.pages).toEqual(['/en/app'])
  })

  it('overrides site.url with siteUrl so a launched server is crawled as self', async () => {
    const fetcher = fakeFetcher({
      '/en/app': '<html><head><title>App page title long enough to pass</title></head><body><h1>App heading long enough here</h1></body></html>',
    })
    const report = await runAudit({
      url: 'http://127.0.0.1:4000/',
      siteUrl: 'http://127.0.0.1:4000',
      cwd: '/tmp',
      fetcher,
      config: { site: { url: 'https://site.test' }, crawl: { entry: ['/en/app'] } },
    })
    expect(report.meta.pagesAudited).toBe(1)
    expect(report.pages).toEqual(['/en/app'])
  })

  it('runs lighthouse on lighthouse.urls even when they were not crawled', async () => {
    const fetcher = fakeFetcher({ '/': '<html><head><title>Home</title></head><body><a href="/a">a</a></body></html>', '/a': '<html></html>' })
    const measured: string[] = []
    await runAudit({
      url: 'https://site.test/',
      cwd: '/tmp',
      fetcher,
      lighthouseRunner: async (url) => {
        measured.push(url)
        return { metrics: { performance: 100 } }
      },
      config: { site: { url: 'https://site.test' }, lighthouse: { enabled: true, runs: 1, urls: ['/landing', '/'] } },
    })
    expect(measured).toEqual(['https://site.test/landing', 'https://site.test/'])
  })

  it('filters sitemap samples through robots.txt but always crawls entry', async () => {
    const pages = {
      '/': '<html></html>',
      '/en/flow/entry': '<html></html>',
      '/en/flow/sampled': '<html></html>',
      '/ok': '<html></html>',
      '/robots.txt': 'User-agent: *\nDisallow: /*/flow/*',
    }
    vi.stubGlobal('fetch', async () => new Response('<urlset><url><loc>https://site.test/en/flow/sampled</loc></url><url><loc>https://site.test/ok</loc></url></urlset>'))
    try {
      const report = await runAudit({
        url: 'https://site.test/',
        cwd: '/tmp',
        fetcher: fakeFetcher(pages),
        config: { site: { url: 'https://site.test' }, crawl: { strategy: 'sitemap+sample', entry: ['/', '/en/flow/entry'] } },
      })
      expect(report.pages.sort()).toEqual(['/', '/en/flow/entry', '/ok'])
      expect(report.crawlStats.disallowed).toBe(1)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('logs urls skipped by robots.txt and honours crawl.respectRobots', async () => {
    const pages = {
      '/': '<html><body><a href="/en/flow/1">f</a><a href="/a">a</a></body></html>',
      '/a': '<html></html>',
      '/en/flow/1': '<html></html>',
      '/robots.txt': 'User-agent: *\nDisallow: /*/flow/*',
    }
    const writes: string[] = []
    const original = process.stderr.write.bind(process.stderr)
    process.stderr.write = ((chunk: string) => {
      writes.push(String(chunk))
      return true
    }) as typeof process.stderr.write
    try {
      const respected = await runAudit({ url: 'https://site.test/', cwd: '/tmp', fetcher: fakeFetcher(pages), config: { site: { url: 'https://site.test' } } })
      expect(respected.pages).toEqual(['/', '/a'])
      expect(respected.crawlStats.disallowed).toBe(1)
      expect(writes.join('')).toContain('1 disallowed by robots.txt')
      const ignored = await runAudit({ url: 'https://site.test/', cwd: '/tmp', fetcher: fakeFetcher(pages), config: { site: { url: 'https://site.test' }, crawl: { respectRobots: false } } })
      expect(ignored.pages.sort()).toEqual(['/', '/a', '/en/flow/1'])
    } finally {
      process.stderr.write = original
    }
  })
})

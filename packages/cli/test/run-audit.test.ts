import type { PageFetcher } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
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
})

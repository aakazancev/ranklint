import { describe, expect, it } from 'vitest'
import { crawl } from '../src/crawler'
import type { PageFetcher, PageSnapshot } from '../src/types'

function fakeFetcher(pages: Record<string, string[]>, failing: string[] = []): PageFetcher {
  return {
    async fetch(url) {
      const path = new URL(url).pathname
      if (failing.includes(path)) throw new Error('boom')
      const links = pages[path]
      if (!links) {
        return { url, html: '', statusCode: 404, headers: {}, ttfb: 1, links: [] }
      }
      return {
        url,
        html: `<html><body>${links.map(l => `<a href="${l}">x</a>`).join('')}</body></html>`,
        statusCode: 200,
        headers: {},
        ttfb: 1,
        links: links.map(href => ({ href, text: 'x' })),
      } satisfies PageSnapshot
    },
    async head() {
      return { statusCode: 200, headers: {} }
    },
    async close() {},
  }
}

const site = 'https://x.com'

describe('crawl', () => {
  it('walks the whole graph with dedup', async () => {
    const fetcher = fakeFetcher({
      '/': ['/a', '/b'],
      '/a': ['/', '/b'],
      '/b': ['/a', '/b#frag'],
    })
    const result = await crawl(fetcher, [site], { siteUrl: site })
    expect(result.snapshots.map(s => new URL(s.url).pathname).sort()).toEqual(['/', '/a', '/b'])
    expect(result.stats.visited).toBe(3)
    expect(result.truncated).toBe(false)
  })

  it('stops at maxPages and marks truncated', async () => {
    const fetcher = fakeFetcher({
      '/': ['/a', '/b', '/c'],
      '/a': [], '/b': [], '/c': [],
    })
    const result = await crawl(fetcher, [site], { siteUrl: site, maxPages: 2, concurrency: 1 })
    expect(result.snapshots.length).toBe(2)
    expect(result.truncated).toBe(true)
  })

  it('counts external links without visiting', async () => {
    const fetcher = fakeFetcher({ '/': ['https://ext.com/x', '/a'], '/a': [] })
    const result = await crawl(fetcher, [site], { siteUrl: site })
    expect(result.stats.external).toBe(1)
    expect(result.stats.visited).toBe(2)
  })

  it('sends foreign zones to reachability queue', async () => {
    const fetcher = fakeFetcher({ '/market': ['/market/a', '/other'], '/market/a': [] })
    const result = await crawl(fetcher, [`${site}/market`], {
      siteUrl: site,
      apps: { self: { paths: ['/market/**'] }, main: { paths: ['/**'], owner: 'external' } },
    })
    expect(result.stats.visited).toBe(2)
    expect(result.reachability).toEqual([{ url: `${site}/other`, zone: 'main', statusCode: 200 }])
  })

  it('skips ignored paths', async () => {
    const fetcher = fakeFetcher({ '/': ['/admin/x', '/a'], '/a': [] })
    const result = await crawl(fetcher, [site], { siteUrl: site, ignore: ['/admin/**'] })
    expect(result.stats.skipped).toBe(1)
    expect(result.stats.visited).toBe(2)
  })

  it('records failed fetch as statusCode 0 with crawl:timeout issue', async () => {
    const fetcher = fakeFetcher({ '/': ['/broken'], '/broken': [] }, ['/broken'])
    const result = await crawl(fetcher, [site], { siteUrl: site })
    const broken = result.snapshots.find(s => s.url.endsWith('/broken'))
    expect(broken?.statusCode).toBe(0)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0]?.checkId).toBe('crawl:timeout')
  })
})

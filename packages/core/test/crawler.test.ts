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

  it('treats tracking params as the same page', async () => {
    const fetcher = fakeFetcher({
      '/': ['/a', '/a?utm_source=x&utm_medium=referral', '/a?gclid=1#top'],
      '/a': ['/?fbclid=2'],
    })
    const result = await crawl(fetcher, [site], { siteUrl: site })
    expect(result.snapshots.map(s => s.url).sort()).toEqual(['https://x.com/', 'https://x.com/a'])
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

  it('reports crawl progress via onPage', async () => {
    const fetcher = fakeFetcher({ '/': ['/a'], '/a': [] })
    const events: { url: string, statusCode: number, visited: number }[] = []
    await crawl(fetcher, [site], {
      siteUrl: site,
      onPage: e => events.push({ url: e.url, statusCode: e.statusCode, visited: e.visited }),
    })
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ statusCode: 200, visited: 1 })
    expect(events.map(e => new URL(e.url).pathname).sort()).toEqual(['/', '/a'])
  })

  it('does not stall on a hanging head request', async () => {
    const fetcher = fakeFetcher({ '/market': ['/other'], '/market/a': [] })
    fetcher.head = () => new Promise(() => {})
    const result = await crawl(fetcher, [`${site}/market`], {
      siteUrl: site,
      timeout: 50,
      apps: { self: { paths: ['/market/**'] }, main: { paths: ['/**'], owner: 'external' } },
    })
    expect(result.reachability).toEqual([{ url: `${site}/other`, zone: 'main', statusCode: 0 }])
  })
})

function withRobots(fetcher: PageFetcher, robots: string | Error, statusCode = 200): PageFetcher & { fetched: string[] } {
  const fetched: string[] = []
  return {
    ...fetcher,
    fetched,
    async fetch(url, opts) {
      fetched.push(url)
      if (new URL(url).pathname !== '/robots.txt') return fetcher.fetch(url, opts)
      if (robots instanceof Error) throw robots
      return { url, html: robots, statusCode, headers: { 'content-type': 'text/plain' }, ttfb: 1, links: [] }
    },
  }
}

describe('crawl respects robots.txt', () => {
  const graph = {
    '/': ['/a', '/en/flow/step', '/private/x', '/files/a.pdf'],
    '/a': [], '/en/flow/step': [], '/private/x': [], '/files/a.pdf': [],
  }
  const robots = 'User-agent: *\nDisallow: /*/flow/*\nDisallow: /private\nDisallow: /*.pdf$\n\nUser-agent: rankbot\nDisallow: /a'

  it('does not enqueue urls disallowed for * and counts them', async () => {
    const fetcher = withRobots(fakeFetcher(graph), robots)
    const result = await crawl(fetcher, [site], { siteUrl: site })
    expect(result.snapshots.map(s => new URL(s.url).pathname).sort()).toEqual(['/', '/a'])
    expect(result.stats.disallowed).toBe(3)
    expect(fetcher.fetched.filter(u => u.endsWith('/robots.txt'))).toEqual(['https://x.com/robots.txt'])
    expect(result.issues).toEqual([])
  })

  it('uses the group matching crawl userAgent', async () => {
    const fetcher = withRobots(fakeFetcher(graph), robots)
    const result = await crawl(fetcher, [site], { siteUrl: site, userAgent: 'Mozilla/5.0 (compatible; RankBot/1.0)' })
    expect(result.snapshots.map(s => new URL(s.url).pathname).sort()).toEqual(['/', '/en/flow/step', '/files/a.pdf', '/private/x'].sort())
    expect(result.stats.disallowed).toBe(1)
  })

  it('always crawls user entry urls', async () => {
    const fetcher = withRobots(fakeFetcher(graph), robots)
    const result = await crawl(fetcher, [site, `${site}/private/x`], { siteUrl: site })
    expect(result.snapshots.map(s => new URL(s.url).pathname).sort()).toEqual(['/', '/a', '/private/x'])
    expect(result.stats.disallowed).toBe(2)
  })

  it('reads robots.txt from ssrHtml when the browser wraps it in html', async () => {
    const base = withRobots(fakeFetcher(graph), robots)
    const fetcher: PageFetcher = {
      ...base,
      async fetch(url, opts) {
        const snap = await base.fetch(url, opts)
        if (new URL(url).pathname !== '/robots.txt') return snap
        return { ...snap, html: `<html><head></head><body><pre>${snap.html}</pre></body></html>`, ssrHtml: snap.html }
      },
    }
    const result = await crawl(fetcher, [site], { siteUrl: site })
    expect(result.stats.disallowed).toBe(3)
  })

  it('applies robots to seeds that are not listed in entries', async () => {
    const fetcher = withRobots(fakeFetcher(graph), robots)
    const result = await crawl(fetcher, [site, `${site}/private/x`, `${site}/files/a.pdf`], { siteUrl: site, entries: [site] })
    expect(result.snapshots.map(s => new URL(s.url).pathname).sort()).toEqual(['/', '/a'])
    expect(result.stats.disallowed).toBe(3)
  })

  it('crawls everything with respectRobots false', async () => {
    const fetcher = withRobots(fakeFetcher(graph), robots)
    const result = await crawl(fetcher, [site], { siteUrl: site, respectRobots: false })
    expect(result.snapshots).toHaveLength(5)
    expect(result.stats.disallowed).toBe(0)
    expect(fetcher.fetched.some(u => u.endsWith('/robots.txt'))).toBe(false)
  })

  it('blocks nothing when robots.txt is missing or fails', async () => {
    for (const fetcher of [withRobots(fakeFetcher(graph), robots, 404), withRobots(fakeFetcher(graph), new Error('boom'))]) {
      const result = await crawl(fetcher, [site], { siteUrl: site })
      expect(result.snapshots).toHaveLength(5)
      expect(result.stats.disallowed).toBe(0)
      expect(result.issues).toEqual([])
    }
  })

  it('does not apply robots rules to reachability zones', async () => {
    const fetcher = withRobots(fakeFetcher({ '/market': ['/private/y'] }), robots)
    const result = await crawl(fetcher, [`${site}/market`], {
      siteUrl: site,
      apps: { self: { paths: ['/market/**', '/market'] }, main: { paths: ['/**'], owner: 'external' } },
    })
    expect(result.reachability).toEqual([{ url: `${site}/private/y`, zone: 'main', statusCode: 200 }])
    expect(result.stats.disallowed).toBe(0)
  })

  it('treats a page redirected to a foreign origin as external', async () => {
    const fetched: string[] = []
    const fetcher: PageFetcher = {
      async fetch(url) {
        fetched.push(url)
        const path = new URL(url).pathname
        if (path === '/l/xbdyq') {
          return { url, finalUrl: 'https://apps.apple.com/us/app/x', html: '', statusCode: 200, headers: {}, ttfb: 1, links: [{ href: '/us/iphone/today', text: 'x' }, { href: '/ca/iphone/today?l=fr', text: 'x' }] }
        }
        return { url, html: '', statusCode: 200, headers: {}, ttfb: 1, links: path === '/' ? [{ href: '/l/xbdyq', text: 'x' }] : [] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const result = await crawl(fetcher, [site], { siteUrl: site, respectRobots: false })
    expect(fetched).toEqual([`${site}/`, `${site}/l/xbdyq`])
    expect(result.snapshots.map(s => s.url)).toEqual([`${site}/`])
    expect(result.stats.visited).toBe(1)
    expect(result.stats.external).toBe(1)
  })

  it('resolves links against the final url after an internal redirect', async () => {
    const fetched: string[] = []
    const fetcher: PageFetcher = {
      async fetch(url) {
        fetched.push(url)
        const path = new URL(url).pathname
        if (path === '/a') {
          return { url, finalUrl: `${site}/b/`, html: '', statusCode: 200, headers: {}, ttfb: 1, links: [{ href: 'child', text: 'x' }] }
        }
        return { url, html: '', statusCode: 200, headers: {}, ttfb: 1, links: path === '/' ? [{ href: '/a', text: 'x' }] : [] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const result = await crawl(fetcher, [site], { siteUrl: site, respectRobots: false })
    expect(fetched).toEqual([`${site}/`, `${site}/a`, `${site}/b/child`])
    expect(result.stats.external).toBe(0)
  })

  it('reports an entry redirected to another origin instead of dropping it silently', async () => {
    const fetcher: PageFetcher = {
      async fetch(url) {
        return { url, finalUrl: url.replace('https://example.com', 'https://www.example.com'), html: '', statusCode: 200, headers: {}, ttfb: 1, links: [{ href: '/about', text: 'x' }] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const result = await crawl(fetcher, ['https://example.com/'], { siteUrl: 'https://example.com', respectRobots: false })
    expect(result.snapshots).toEqual([])
    expect(result.stats.visited).toBe(0)
    expect(result.issues).toEqual([{
      checkId: 'crawl:entry-redirect',
      severity: 'error',
      message: 'Entry https://example.com/ redirects to https://www.example.com/, outside https://example.com',
      url: 'https://example.com/',
      suggestion: 'Set site.url / --url to https://www.example.com',
    }])
  })

  it('crawls the other entries when one entry leaves the site origin', async () => {
    const fetcher: PageFetcher = {
      async fetch(url) {
        const path = new URL(url).pathname
        const finalUrl = path === '/old' ? 'https://other.com/' : url
        return { url, finalUrl, html: '', statusCode: 200, headers: {}, ttfb: 1, links: [] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const seeds = [`${site}/old`, `${site}/`]
    const result = await crawl(fetcher, seeds, { siteUrl: site, respectRobots: false, entries: seeds })
    expect(result.snapshots.map(s => s.url)).toEqual([`${site}/`])
    expect(result.issues.map(i => i.checkId)).toEqual(['crawl:entry-redirect'])
  })

  it('keeps one snapshot for urls redirecting to an already known page', async () => {
    const fetcher: PageFetcher = {
      async fetch(url) {
        const path = new URL(url).pathname
        if (path === '/a') return { url, finalUrl: `${site}/b/`, html: '', statusCode: 200, headers: {}, ttfb: 1, links: [] }
        return { url, html: '', statusCode: 200, headers: {}, ttfb: 1, links: path === '/' ? [{ href: '/a', text: 'x' }, { href: '/b/', text: 'x' }] : [] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const result = await crawl(fetcher, [site], { siteUrl: site, respectRobots: false })
    expect(result.snapshots.map(s => s.url).sort()).toEqual([`${site}/`, `${site}/b/`])
  })

  it('does not fetch a redirect target already reached through another url', async () => {
    const fetched: string[] = []
    const fetcher: PageFetcher = {
      async fetch(url) {
        fetched.push(url)
        const path = new URL(url).pathname
        if (path === '/a') return { url, finalUrl: `${site}/b/`, html: '', statusCode: 200, headers: {}, ttfb: 1, links: [{ href: '/b/', text: 'x' }] }
        return { url, html: '', statusCode: 200, headers: {}, ttfb: 1, links: path === '/' ? [{ href: '/a', text: 'x' }] : [] }
      },
      async head() {
        return { statusCode: 200, headers: {} }
      },
      async close() {},
    }
    const result = await crawl(fetcher, [site], { siteUrl: site, respectRobots: false })
    expect(fetched).toEqual([`${site}/`, `${site}/a`])
    expect(result.snapshots.map(s => s.url)).toEqual([`${site}/`, `${site}/b/`])
  })
})

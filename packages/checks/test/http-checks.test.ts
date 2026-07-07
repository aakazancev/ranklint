import type { CheckContext, PageFetcher, PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { noSoft404, ttfbBudget, viewport, xRobotsConsistent } from '../src/checks/http/http'
import { permanentRedirects, trailingSlashConsistent } from '../src/checks/links/redirects'
import { fakeHeadFetcher, runCheckOnHtml, stubFetcher } from '../src/test-utils'

function snap(path: string, overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: `https://x.com${path}`,
    html: '<html><head><title>Regular page title</title></head><body></body></html>',
    statusCode: 200,
    headers: {},
    ttfb: 100,
    links: [],
    ...overrides,
  }
}

function siteCtx(pages: PageSnapshot[], fetcher: PageFetcher = stubFetcher, options: Record<string, unknown> = {}): CheckContext {
  return {
    pages,
    config: { severity: 'error', options },
    site: { url: 'https://x.com' },
    fetcher,
  }
}

describe('http:no-soft-404', () => {
  it('flags 200 on nonexistent probe url', async () => {
    const fetcher = { ...stubFetcher, head: async () => ({ statusCode: 200, headers: {} }) }
    const issues = await noSoft404.run(siteCtx([], fetcher))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('soft 404')
  })

  it('flags 200-pages with not-found titles, passes healthy sites', async () => {
    const fetcher = { ...stubFetcher, head: async () => ({ statusCode: 404, headers: {} }) }
    const errorish = snap('/ghost', { html: '<html><head><title>Page not found — Site</title></head><body></body></html>' })
    const issues = await noSoft404.run(siteCtx([errorish, snap('/ok')], fetcher))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.url).toContain('/ghost')
    expect(await noSoft404.run(siteCtx([snap('/ok')], fetcher))).toEqual([])
  })
})

describe('http:x-robots-consistent', () => {
  const conflictingHtml = '<html><head><meta name="robots" content="index, follow"></head><body></body></html>'
  const agreeingHtml = '<html><head><meta name="robots" content="noindex"></head><body></body></html>'

  async function runWithHeader(html: string, header: string) {
    const { parseHTML } = await import('linkedom')
    return xRobotsConsistent.run({
      page: snap('/', { headers: { 'x-robots-tag': header }, html }),
      document: parseHTML(html).document as unknown as Document,
      config: { severity: 'error', options: {} },
      site: { url: 'https://x.com' },
      fetcher: stubFetcher,
    })
  }

  it('flags header/meta conflict, passes agreement and absence', async () => {
    expect(await runWithHeader(conflictingHtml, 'noindex')).toHaveLength(1)
    expect(await runWithHeader(agreeingHtml, 'noindex')).toEqual([])
    expect(await runWithHeader(conflictingHtml, '')).toEqual([])
  })
})

describe('http:ttfb-budget', () => {
  it('flags groups above budget by pattern', async () => {
    const pages = [
      snap('/listing/1', { ttfb: 900 }),
      snap('/listing/2', { ttfb: 1000 }),
      snap('/', { ttfb: 100 }),
    ]
    const issues = await ttfbBudget.run(siteCtx(pages, stubFetcher, {
      budgets: { '/listing/**': 500, '/**': 800 },
    }))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('/listing/**')
  })

  it('passes within default budget', async () => {
    expect(await ttfbBudget.run(siteCtx([snap('/', { ttfb: 200 })]))).toEqual([])
  })
})

describe('mobile:viewport', () => {
  it('requires viewport meta', async () => {
    expect(await runCheckOnHtml(viewport, '<html><head><meta name="viewport" content="width=device-width"></head><body></body></html>')).toEqual([])
    expect(await runCheckOnHtml(viewport, '<html><head></head><body></body></html>')).toHaveLength(1)
  })
})

describe('links:permanent-redirects', () => {
  it('flags temporary 302 first hop, allows 301', async () => {
    const fetcher = fakeHeadFetcher({
      'https://example.com/temp': { status: 302, location: '/final' },
      'https://example.com/perm': { status: 301, location: '/final' },
      'https://example.com/final': { status: 200 },
    })
    const html = '<html><body><a href="/temp">t</a><a href="/perm">p</a></body></html>'
    const links = [{ href: '/temp', text: 't' }, { href: '/perm', text: 'p' }]
    const issues = await runCheckOnHtml(permanentRedirects, html, { links, fetcher })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('a[href="/temp"]')
  })
})

describe('links:trailing-slash-consistent', () => {
  it('flags minority style pages', async () => {
    const issues = await trailingSlashConsistent.run(siteCtx([
      snap('/a'),
      snap('/b'),
      snap('/c/'),
    ]))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('"/c/"')
  })

  it('passes consistent sites', async () => {
    expect(await trailingSlashConsistent.run(siteCtx([snap('/a'), snap('/b')]))).toEqual([])
  })
})

describe('http:ttfb-budget auto route groups', () => {
  it('groups pages by inferred route pattern when no budgets configured', async () => {
    const pages = [
      snap('/listing/1', { ttfb: 900 }),
      snap('/listing/2', { ttfb: 1000 }),
      snap('/', { ttfb: 100 }),
    ]
    const issues = await ttfbBudget.run(siteCtx(pages))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('/listing/*')
  })
})

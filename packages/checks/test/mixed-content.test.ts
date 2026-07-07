import type { CheckContext, PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { canonicalNoChain } from '../src/checks/canonical/canonical'
import { noMixedContent } from '../src/checks/http/mixed-content'
import { runCheckOnHtml, stubFetcher } from '../src/test-utils'

describe('http:no-mixed-content', () => {
  const insecure = '<html><head><script src="http://cdn.example/lib.js"></script></head>'
    + '<body><img src="http://cdn.example/pic.png" alt="x" width="1" height="1"></body></html>'

  it('flags http resources on https pages', async () => {
    const issues = await runCheckOnHtml(noMixedContent, insecure, { url: 'https://x.com/page' })
    expect(issues).toHaveLength(2)
    expect(issues[0]?.selector).toBe('script[src="http://cdn.example/lib.js"]')
  })

  it('ignores http pages and https resources', async () => {
    expect(await runCheckOnHtml(noMixedContent, insecure, { url: 'http://x.com/page' })).toEqual([])
    const secure = insecure.replaceAll('http://cdn', 'https://cdn')
    expect(await runCheckOnHtml(noMixedContent, secure, { url: 'https://x.com/page' })).toEqual([])
  })
})

function snapWithCanonical(path: string, canonical: string | null): PageSnapshot {
  const link = canonical ? `<link rel="canonical" href="https://x.com${canonical}">` : ''
  return {
    url: `https://x.com${path}`,
    html: `<html><head><title>Canonical chain fixture title</title>${link}</head><body></body></html>`,
    statusCode: 200,
    headers: {},
    ttfb: 1,
    links: [],
  }
}

function siteCtx(pages: PageSnapshot[]): CheckContext {
  return { pages, config: { severity: 'warn', options: {} }, site: { url: 'https://x.com' }, fetcher: stubFetcher }
}

describe('canonical:no-chain', () => {
  it('flags a page whose canonical target canonicalizes elsewhere', async () => {
    const pages = [
      snapWithCanonical('/a', '/b'),
      snapWithCanonical('/b', '/c'),
      snapWithCanonical('/c', '/c'),
    ]
    const issues = await canonicalNoChain.run(siteCtx(pages))
    expect(issues).toHaveLength(1)
    expect(new URL(issues[0]!.url).pathname).toBe('/a')
    expect(issues[0]?.message).toContain('"/b"')
    expect(issues[0]?.message).toContain('"/c"')
  })

  it('accepts self-canonicals and single hops', async () => {
    const pages = [snapWithCanonical('/a', '/b'), snapWithCanonical('/b', '/b')]
    expect(await canonicalNoChain.run(siteCtx(pages))).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { noBroken, noRedirectChain } from '../src/checks/links/links'
import { noUtmInternal } from '../src/checks/links/utm-internal'
import { fakeHeadFetcher, runCheckOnHtml } from '../src/test-utils'

const html = '<html><body><a href="/ok">a</a><a href="/dead">b</a><a href="https://ext.com/x">c</a></body></html>'
const links = [
  { href: '/ok', text: 'a' },
  { href: '/dead', text: 'b' },
  { href: 'https://ext.com/x', text: 'c' },
]

describe('links:no-broken', () => {
  it('flags 4xx internal links, ignores external', async () => {
    const fetcher = fakeHeadFetcher({
      'https://example.com/ok': { status: 200 },
      'https://example.com/dead': { status: 404 },
    })
    const issues = await runCheckOnHtml(noBroken, html, { links, fetcher })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('a[href="/dead"]')
    expect(issues[0]?.message).toContain('404')
  })

  it('flags network failures as broken', async () => {
    const fetcher = {
      ...fakeHeadFetcher({}),
      head: async () => {
        throw new Error('down')
      },
    }
    const issues = await runCheckOnHtml(noBroken, html, { links: [{ href: '/x', text: 'x' }], fetcher })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('network error')
  })

  it('passes when all internal links are alive', async () => {
    const fetcher = fakeHeadFetcher({
      'https://example.com/ok': { status: 200 },
      'https://example.com/dead': { status: 200 },
    })
    expect(await runCheckOnHtml(noBroken, html, { links, fetcher })).toEqual([])
  })

  it('checks links differing only in tracking params once, reporting the first href', async () => {
    const requested: string[] = []
    const fetcher = {
      ...fakeHeadFetcher({}),
      head: async (url: string) => {
        requested.push(url)
        return { statusCode: 404, headers: {} }
      },
    }
    const issues = await runCheckOnHtml(noBroken, html, {
      links: [{ href: '/gone?utm_source=x', text: 'a' }, { href: '/gone', text: 'b' }],
      fetcher,
    })
    expect(requested).toEqual(['https://example.com/gone'])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('a[href="/gone?utm_source=x"]')
  })
})

describe('links:no-redirect-chain', () => {
  it('allows single redirect by default, flags chains', async () => {
    const fetcher = fakeHeadFetcher({
      'https://example.com/one': { status: 301, location: '/final' },
      'https://example.com/chain': { status: 301, location: '/mid' },
      'https://example.com/mid': { status: 302, location: '/final' },
      'https://example.com/final': { status: 200 },
    })
    const testLinks = [{ href: '/one', text: 'x' }, { href: '/chain', text: 'y' }]
    const issues = await runCheckOnHtml(noRedirectChain, html, { links: testLinks, fetcher })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('a[href="/chain"]')
    expect(issues[0]?.message).toContain('2 redirects')
  })

  it('respects maxHops option', async () => {
    const fetcher = fakeHeadFetcher({
      'https://example.com/one': { status: 301, location: '/final' },
      'https://example.com/final': { status: 200 },
    })
    const issues = await runCheckOnHtml(noRedirectChain, html, {
      links: [{ href: '/one', text: 'x' }],
      fetcher,
      options: { maxHops: 0 },
    })
    expect(issues).toHaveLength(1)
  })
})

const page = (body: string) => `<html><body>${body}</body></html>`
const run = (body: string) => runCheckOnHtml(noUtmInternal, page(body), { url: 'https://x.com/blog/post' })

describe('links:no-utm-internal', () => {
  it('passes for internal links without tracking params', async () => {
    expect(await run('<a href="/catalog?page=2">a</a><a href="https://x.com/about#team">b</a>')).toEqual([])
  })

  it('flags internal links with tracking params once per href', async () => {
    const issues = await run(
      '<a href="/catalog?utm_source=menu">a</a>'
      + '<a href="/catalog?utm_source=menu">a2</a>'
      + '<a href="https://x.com/sale?gclid=1">b</a>'
      + '<a href="next?_gl=abc&page=1">c</a>'
      + '<a href="?fbclid=z">d</a>',
    )
    expect(issues.map(i => i.message)).toEqual([
      'Internal link "/catalog?utm_source=menu" carries tracking parameters: utm_source',
      'Internal link "https://x.com/sale?gclid=1" carries tracking parameters: gclid',
      'Internal link "next?_gl=abc&page=1" carries tracking parameters: _gl',
      'Internal link "?fbclid=z" carries tracking parameters: fbclid',
    ])
    expect(issues[0]).toMatchObject({
      checkId: 'links:no-utm-internal',
      severity: 'warn',
      url: 'https://x.com/blog/post',
      selector: 'a[href="/catalog?utm_source=menu"]',
    })
    expect(issues[0]?.suggestion).toMatch(/NuxtLink/)
    expect(issues[0]?.docs).toBe('https://ranklint.dev/en/rules/links/links-no-utm-internal')
  })

  it('recognises every tracking parameter', async () => {
    const params = ['utm_campaign', 'gbraid', 'wbraid', 'yclid', 'msclkid', 'mc_cid', 'mc_eid']
    const issues = await run(params.map(p => `<a href="/p?${p}=1">x</a>`).join(''))
    expect(issues).toHaveLength(params.length)
  })

  it('is silent without links', async () => {
    expect(await run('<p>no links</p>')).toEqual([])
  })

  it('is silent for external links with tracking params', async () => {
    expect(await run('<a href="https://ext.com/?utm_source=x">a</a><a href="http://x.com/?utm_source=x">b</a>')).toEqual([])
  })

  it('flags percent-encoded tracking param names', async () => {
    const issues = await run('<a href="/p?utm%5Fsource=1">a</a>')
    expect(issues.map(i => i.message)).toEqual(['Internal link "/p?utm%5Fsource=1" carries tracking parameters: utm_source'])
  })

  it('escapes quotes and backslashes in the selector', async () => {
    const issues = await run('<a href=\'/p?utm_source=a"b\\c\'>a</a>')
    expect(issues[0]?.selector).toBe('a[href="/p?utm_source=a\\"b\\\\c"]')
  })

  it('ignores lookalike parameter names', async () => {
    expect(await run('<a href="/p?utmost=1&utm=2&gclid_x=3&my_utm_source=4">a</a>')).toEqual([])
  })
})

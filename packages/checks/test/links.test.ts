import { describe, expect, it } from 'vitest'
import { noBroken, noRedirectChain } from '../src/checks/links/links'
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

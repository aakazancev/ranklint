import { describe, expect, it } from 'vitest'
import { canonicalRequired, canonicalValid } from '../src/checks/canonical/canonical'
import { fakeHeadFetcher, runCheckOnHtml } from '../src/test-utils'

function page(head: string): string {
  return `<html><head>${head}</head><body></body></html>`
}

describe('canonical:required', () => {
  it('passes with canonical, fails without', async () => {
    expect(await runCheckOnHtml(canonicalRequired, page('<link rel="canonical" href="https://x.com/a">'))).toEqual([])
    expect(await runCheckOnHtml(canonicalRequired, page(''))).toHaveLength(1)
    expect(await runCheckOnHtml(canonicalRequired, page('<link rel="canonical" href="">'))).toHaveLength(1)
  })
})

describe('canonical:valid', () => {
  it('is silent when canonical is absent', async () => {
    expect(await runCheckOnHtml(canonicalValid, page(''))).toEqual([])
  })

  it('rejects relative canonical', async () => {
    const issues = await runCheckOnHtml(canonicalValid, page('<link rel="canonical" href="/a">'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('not an absolute URL')
  })

  it('accepts live 200 canonical', async () => {
    const fetcher = fakeHeadFetcher({ 'https://x.com/a': { status: 200 } })
    expect(await runCheckOnHtml(canonicalValid, page('<link rel="canonical" href="https://x.com/a">'), { fetcher })).toEqual([])
  })

  it('rejects canonical pointing to redirect', async () => {
    const fetcher = fakeHeadFetcher({
      'https://x.com/a': { status: 301, location: '/b' },
      'https://x.com/b': { status: 200 },
    })
    const issues = await runCheckOnHtml(canonicalValid, page('<link rel="canonical" href="https://x.com/a">'), { fetcher })
    expect(issues[0]?.message).toContain('redirect')
  })

  it('rejects canonical answering 404', async () => {
    const fetcher = fakeHeadFetcher({ 'https://x.com/a': { status: 404 } })
    const issues = await runCheckOnHtml(canonicalValid, page('<link rel="canonical" href="https://x.com/a">'), { fetcher })
    expect(issues[0]?.message).toContain('404')
  })
})

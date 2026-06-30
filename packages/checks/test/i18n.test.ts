import type { CheckContext, PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { hreflangSymmetric, hreflangValidTargets } from '../src/checks/i18n/hreflang'
import { noLocaleLeak } from '../src/checks/i18n/locale-leak'
import { fakeHeadFetcher, runCheckOnHtml, stubFetcher } from '../src/test-utils'

function pageWith(head: string, lang = 'en'): string {
  return `<html lang="${lang}"><head>${head}</head><body></body></html>`
}

function snap(url: string, html: string): PageSnapshot {
  return { url, html, statusCode: 200, headers: {}, ttfb: 1, links: [] }
}

describe('hreflang:valid-targets', () => {
  it('passes live targets, flags 404 and redirects', async () => {
    const head = '<link rel="alternate" hreflang="en" href="https://x.com/en/a">'
      + '<link rel="alternate" hreflang="ru" href="https://x.com/ru/a">'
      + '<link rel="alternate" hreflang="de" href="https://x.com/de/a">'
    const fetcher = fakeHeadFetcher({
      'https://x.com/en/a': { status: 200 },
      'https://x.com/ru/a': { status: 404 },
      'https://x.com/de/a': { status: 301, location: '/de/b' },
      'https://x.com/de/b': { status: 200 },
    })
    const issues = await runCheckOnHtml(hreflangValidTargets, pageWith(head), { fetcher })
    expect(issues).toHaveLength(2)
    expect(issues.find(i => i.selector?.includes('ru'))?.message).toContain('404')
    expect(issues.find(i => i.selector?.includes('de'))?.message).toContain('redirect')
  })
})

describe('hreflang:symmetric', () => {
  function runSite(pages: PageSnapshot[]) {
    const ctx: CheckContext = {
      pages,
      config: { severity: 'error', options: {} },
      site: { url: 'https://x.com' },
      fetcher: stubFetcher,
    }
    return hreflangSymmetric.run(ctx)
  }

  const enHead = '<link rel="alternate" hreflang="x-default" href="/en/a">'
    + '<link rel="alternate" hreflang="ru" href="/ru/a">'
  const ruHeadBack = '<link rel="alternate" hreflang="x-default" href="/en/a">'
    + '<link rel="alternate" hreflang="en" href="/en/a">'

  it('passes symmetric pairs with x-default', async () => {
    const issues = await runSite([
      snap('https://x.com/en/a', pageWith(enHead)),
      snap('https://x.com/ru/a', pageWith(ruHeadBack, 'ru')),
    ])
    expect(issues).toEqual([])
  })

  it('flags missing back-reference', async () => {
    const issues = await runSite([
      snap('https://x.com/en/a', pageWith(enHead)),
      snap('https://x.com/ru/a', pageWith('<link rel="alternate" hreflang="x-default" href="/ru/a">', 'ru')),
    ])
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('no link back')
  })

  it('flags missing x-default', async () => {
    const issues = await runSite([
      snap('https://x.com/en/a', pageWith('<link rel="alternate" hreflang="ru" href="/ru/a">')),
    ])
    expect(issues[0]?.message).toContain('x-default')
  })
})

describe('i18n:no-locale-leak', () => {
  it('flags lang mismatch under locale prefix', async () => {
    const issues = await runCheckOnHtml(noLocaleLeak, pageWith('', 'en'), { url: 'https://x.com/ru/page' })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('"/ru/"')
  })

  it('passes matching locale, no prefix, or missing lang', async () => {
    expect(await runCheckOnHtml(noLocaleLeak, pageWith('', 'ru-RU'), { url: 'https://x.com/ru/page' })).toEqual([])
    expect(await runCheckOnHtml(noLocaleLeak, pageWith('', 'en'), { url: 'https://x.com/page' })).toEqual([])
    expect(await runCheckOnHtml(noLocaleLeak, '<html><body></body></html>', { url: 'https://x.com/ru/page' })).toEqual([])
  })
})

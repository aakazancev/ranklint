import type { CheckContext, PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { hreflangSymmetric, hreflangValidTargets } from '../src/checks/i18n/hreflang'
import { detectTextLanguage, noLocaleLeak } from '../src/checks/i18n/locale-leak'
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

describe('i18n:no-locale-leak text heuristic', () => {
  const ruText = 'Это длинный текст на русском языке про автомобили и запчасти, он достаточно длинный, чтобы сработала эвристика определения языка страницы по алфавиту.'
  const enText = 'The quick brown fox jumps over the lazy dog and this text is long enough for the detection with the stopwords that are common in the english language.'
  const arText = 'هذا نص طويل باللغة العربية عن السيارات وقطع الغيار وهو طويل بما يكفي لكي تعمل خوارزمية تحديد لغة الصفحة حسب الأبجدية المستخدمة في النص المعروض.'

  it('flags cyrillic text under /en/ even when lang matches url', async () => {
    const html = `<html lang="en"><head></head><body><p>${ruText}</p></body></html>`
    const issues = await runCheckOnHtml(noLocaleLeak, html, { url: 'https://x.com/en/page' })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('body')
    expect(issues[0]?.message).toContain('cyrillic')
  })

  it('flags arabic text under /en/ even when lang matches url', async () => {
    const html = `<html lang="en"><head></head><body><p>${arText}</p></body></html>`
    const issues = await runCheckOnHtml(noLocaleLeak, html, { url: 'https://x.com/en/page' })
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('arabic')
  })

  it('flags english text under /ar/ and passes arabic under /ar/ and /fa/', async () => {
    const en = `<html lang="ar"><head></head><body><p>${enText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, en, { url: 'https://x.com/ar/page' })).toHaveLength(1)
    const ar = `<html lang="ar"><head></head><body><p>${arText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, ar, { url: 'https://x.com/ar/page' })).toEqual([])
    const fa = `<html lang="fa"><head></head><body><p>${arText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, fa, { url: 'https://x.com/fa/page' })).toEqual([])
  })

  it('passes matching text and skips unknown url locales', async () => {
    const en = `<html lang="en"><head></head><body><p>${enText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, en, { url: 'https://x.com/en/page' })).toEqual([])
    const ru = `<html lang="ru"><head></head><body><p>${ruText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, ru, { url: 'https://x.com/ru/page' })).toEqual([])
    const pt = `<html lang="pt"><head></head><body><p>${enText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, pt, { url: 'https://x.com/pt/page' })).toEqual([])
  })

  it('ignores script and style text when detecting the language', async () => {
    const js = 'for (const item of items) { if (this.that) { window.data = data.filter(x => x.from && x.are) } } '.repeat(30)
    const html = `<html lang="ru"><head></head><body><script>${js}</script><style>.a { color: red; }</style><p>${ruText}</p></body></html>`
    expect(await runCheckOnHtml(noLocaleLeak, html, { url: 'https://x.com/ru/page' })).toEqual([])
  })

  it('detectTextLanguage identifies scripts and stopword languages', () => {
    expect(detectTextLanguage(ruText)).toBe('cyrillic')
    expect(detectTextLanguage(arText)).toBe('arabic')
    expect(detectTextLanguage(enText)).toBe('en')
    expect(detectTextLanguage('too short')).toBeUndefined()
  })
})

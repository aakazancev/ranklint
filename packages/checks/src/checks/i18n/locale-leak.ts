import type { Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

const LOCALE_SEGMENT = /^\/([a-z]{2})(?:-[a-z]{2})?(?:\/|$)/i

const CYRILLIC_LOCALES = new Set(['ru', 'uk', 'be', 'bg', 'sr', 'mk', 'kk'])

const STOPWORDS: Record<string, string[]> = {
  en: ['the', 'and', 'for', 'with', 'that', 'this', 'from', 'are'],
  de: ['der', 'die', 'und', 'das', 'nicht', 'ein', 'mit', 'ist'],
  fr: ['le', 'la', 'les', 'des', 'est', 'une', 'dans', 'pour'],
  es: ['el', 'los', 'las', 'una', 'que', 'para', 'por', 'más'],
  it: ['il', 'per', 'con', 'una', 'che', 'non', 'sono', 'della'],
}

export function detectTextLanguage(text: string): string | undefined {
  const sample = text.slice(0, 4000)
  const cyrillic = (sample.match(/[Ѐ-ӿ]/g) ?? []).length
  const latin = (sample.match(/[a-z]/gi) ?? []).length
  if (cyrillic + latin < 40) return undefined
  if (cyrillic > (cyrillic + latin) * 0.5) return 'cyrillic'
  const words = sample.toLowerCase().match(/[\p{L}']+/gu) ?? []
  const scores = Object.entries(STOPWORDS)
    .map(([lang, stopwords]) => {
      const set = new Set(stopwords)
      return [lang, words.filter(word => set.has(word)).length] as const
    })
    .sort((a, b) => b[1] - a[1])
  const [best, runnerUp] = scores
  if (!best || best[1] < 3) return undefined
  if (runnerUp && runnerUp[1] > 0 && best[1] < runnerUp[1] * 2) return undefined
  return best[0]
}

function textMatchesLocale(detected: string, locale: string): boolean {
  if (detected === 'cyrillic') return CYRILLIC_LOCALES.has(locale)
  return detected === locale
}

function visibleText(body: Element | null): string {
  if (!body) return ''
  const clone = body.cloneNode(true) as Element
  for (const el of clone.querySelectorAll('script, style, noscript, template')) el.remove()
  return clone.textContent ?? ''
}

export const noLocaleLeak = defineCheck({
  id: 'i18n:no-locale-leak',
  category: 'i18n',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('i18n:no-locale-leak'),
  async run(ctx) {
    const match = LOCALE_SEGMENT.exec(new URL(ctx.page!.url).pathname)
    if (!match) return []
    const urlLocale = match[1]!.toLowerCase()
    const issues: Issue[] = []
    const htmlLang = ctx.document?.documentElement?.getAttribute('lang')?.toLowerCase() ?? ''
    if (htmlLang && htmlLang.split('-')[0] !== urlLocale) {
      issues.push({
        checkId: 'i18n:no-locale-leak',
        severity: 'error',
        message: `URL locale prefix is "/${urlLocale}/" but page lang is "${htmlLang}"`,
        url: ctx.page!.url,
        selector: 'html[lang]',
        suggestion: 'The page likely serves content of another locale — check the locale routing',
        docs: docsUrl('i18n:no-locale-leak'),
      })
    }
    const localeKnown = urlLocale in STOPWORDS || CYRILLIC_LOCALES.has(urlLocale)
    const detected = localeKnown
      ? detectTextLanguage(visibleText(ctx.document?.querySelector('body') ?? null))
      : undefined
    if (detected && !textMatchesLocale(detected, urlLocale)) {
      const label = detected === 'cyrillic' ? 'a cyrillic-script language' : `"${detected}"`
      issues.push({
        checkId: 'i18n:no-locale-leak',
        severity: 'error',
        message: `URL locale prefix is "/${urlLocale}/" but page text looks like ${label}`,
        url: ctx.page!.url,
        selector: 'body',
        suggestion: 'The page text does not match the URL locale — check the locale routing and translations',
        docs: docsUrl('i18n:no-locale-leak'),
      })
    }
    return issues
  },
})

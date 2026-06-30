import { defineCheck, docsUrl } from '../../define'

const LOCALE_SEGMENT = /^\/([a-z]{2})(?:-[a-z]{2})?(?:\/|$)/i

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
    const htmlLang = ctx.document?.documentElement?.getAttribute('lang')?.toLowerCase() ?? ''
    if (!htmlLang) return []
    const primary = htmlLang.split('-')[0]
    if (primary === urlLocale) return []
    return [{
      checkId: 'i18n:no-locale-leak',
      severity: 'error' as const,
      message: `URL locale prefix is "/${urlLocale}/" but page lang is "${htmlLang}"`,
      url: ctx.page!.url,
      selector: 'html[lang]',
      suggestion: 'The page likely serves content of another locale — check the locale routing',
      docs: docsUrl('i18n:no-locale-leak'),
    }]
  },
})

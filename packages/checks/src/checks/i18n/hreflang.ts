import type { Issue, PageSnapshot } from '@ranklint/core'
import { getDocument } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'
import { resolveUrl } from '../../net'

interface Alternate {
  hreflang: string
  href: string
}

function alternates(doc: Document): Alternate[] {
  return [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(el => ({
    hreflang: el.getAttribute('hreflang') ?? '',
    href: el.getAttribute('href') ?? '',
  }))
}

export const hreflangValidTargets = defineCheck({
  id: 'hreflang:valid-targets',
  category: 'i18n',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('hreflang:valid-targets'),
  async run(ctx) {
    const issues: Issue[] = []
    for (const alt of alternates(ctx.document!)) {
      if (!alt.href) continue
      const { status, hops } = await resolveUrl(ctx.fetcher, alt.href)
      if (status === 200 && hops === 0) continue
      issues.push({
        checkId: 'hreflang:valid-targets',
        severity: 'error',
        message: hops > 0
          ? `hreflang "${alt.hreflang}" points to a redirect (${alt.href})`
          : `hreflang "${alt.hreflang}" target responds with ${status || 'network error'} (${alt.href})`,
        url: ctx.page!.url,
        selector: `link[hreflang="${alt.hreflang}"]`,
        suggestion: 'Point hreflang at the final live URL of the locale version',
        docs: docsUrl('hreflang:valid-targets'),
      })
    }
    return issues
  },
})

function pathOf(url: string, base: string): string | null {
  try {
    return new URL(url, base).pathname
  } catch {
    return null
  }
}

export const hreflangSymmetric = defineCheck({
  id: 'hreflang:symmetric',
  category: 'i18n',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('hreflang:symmetric'),
  async run(ctx) {
    const pages = ctx.pages ?? []
    const byPath = new Map<string, { page: PageSnapshot, alternates: Alternate[] }>()
    for (const page of pages) {
      const path = pathOf(page.url, ctx.site.url)
      if (path) byPath.set(path, { page, alternates: alternates(getDocument(page)) })
    }
    const issues: Issue[] = []
    for (const [path, entry] of byPath) {
      if (entry.alternates.length === 0) continue
      if (!entry.alternates.some(a => a.hreflang === 'x-default')) {
        issues.push({
          checkId: 'hreflang:symmetric',
          severity: 'error',
          message: 'hreflang set has no x-default',
          url: entry.page.url,
          selector: 'link[hreflang]',
          suggestion: 'Add <link rel="alternate" hreflang="x-default"> pointing at the fallback locale',
          docs: docsUrl('hreflang:symmetric'),
        })
      }
      for (const alt of entry.alternates) {
        const targetPath = pathOf(alt.href, ctx.site.url)
        if (!targetPath || targetPath === path) continue
        const target = byPath.get(targetPath)
        if (!target) continue
        const pointsBack = target.alternates.some(a => pathOf(a.href, ctx.site.url) === path)
        if (!pointsBack) {
          issues.push({
            checkId: 'hreflang:symmetric',
            severity: 'error',
            message: `"${path}" links hreflang "${alt.hreflang}" to "${targetPath}", but there is no link back`,
            url: entry.page.url,
            selector: `link[hreflang="${alt.hreflang}"]`,
            suggestion: `Add a reciprocal hreflang link from "${targetPath}" back to "${path}"`,
            docs: docsUrl('hreflang:symmetric'),
          })
        }
      }
    }
    return issues
  },
})

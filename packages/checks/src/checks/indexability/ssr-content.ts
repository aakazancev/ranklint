import { parseHTML } from 'linkedom'
import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

function textOf(html: string): { h1: string, bodyText: string } {
  const { document } = parseHTML(html)
  return {
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    bodyText: document.querySelector('body')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  }
}

export const ssrContent = defineCheck({
  id: 'indexability:ssr-content',
  category: 'indexability',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('indexability:ssr-content'),
  optionsSchema: z.object({
    minRatio: z.number().min(0).max(1).optional(),
  }),
  async run(ctx) {
    const ssrHtml = ctx.page!.ssrHtml
    if (!ssrHtml) return []
    const { minRatio = 0.5 } = ctx.config.options as { minRatio?: number }
    const ssr = textOf(ssrHtml)
    const hydrated = textOf(ctx.page!.html)
    const issues = []
    if (hydrated.h1 && !ssr.bodyText.includes(hydrated.h1)) {
      issues.push({
        checkId: 'indexability:ssr-content',
        severity: 'error' as const,
        message: 'H1 is rendered client-side only — crawlers without JS will not see it',
        url: ctx.page!.url,
        selector: 'h1',
        suggestion: 'Render the H1 on the server (SSR/SSG), not inside client-only components',
        docs: docsUrl('indexability:ssr-content'),
      })
    }
    if (hydrated.bodyText.length > 0) {
      const ratio = ssr.bodyText.length / hydrated.bodyText.length
      if (ratio < minRatio) {
        issues.push({
          checkId: 'indexability:ssr-content',
          severity: 'error' as const,
          message: `Only ${Math.round(ratio * 100)}% of the page text is server-rendered (minimum ${Math.round(minRatio * 100)}%)`,
          url: ctx.page!.url,
          selector: 'body',
          suggestion: 'Move critical content out of client-only rendering so it is present before hydration',
          docs: docsUrl('indexability:ssr-content'),
        })
      }
    }
    return issues
  },
})

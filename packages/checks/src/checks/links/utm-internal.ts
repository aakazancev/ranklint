import { type Issue, isTrackingParam } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

export const noUtmInternal = defineCheck({
  id: 'links:no-utm-internal',
  category: 'links',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('links:no-utm-internal'),
  async run(ctx) {
    const pageUrl = ctx.page!.url
    const origin = new URL(pageUrl).origin
    const seen = new Set<string>()
    const issues: Issue[] = []
    for (const el of ctx.document!.querySelectorAll('a[href]')) {
      const href = el.getAttribute('href') ?? ''
      if (seen.has(href)) continue
      seen.add(href)
      let resolved: URL
      try {
        resolved = new URL(href, pageUrl)
      } catch {
        continue
      }
      if (resolved.origin !== origin) continue
      const params = [...new Set([...resolved.searchParams.keys()].filter(isTrackingParam))]
      if (!params.length) continue
      issues.push({
        checkId: 'links:no-utm-internal',
        severity: 'warn',
        message: `Internal link "${href}" carries tracking parameters: ${params.join(', ')}`,
        url: pageUrl,
        selector: `a[href="${href.replace(/["\\]/g, '\\$&')}"]`,
        suggestion: 'Remove UTM and click-id parameters from internal links: they overwrite the visit source in analytics. Use a plain <NuxtLink to="/path"> and track internal clicks with an analytics event (for example a @click handler or a Nuxt plugin calling gtag/umami)',
        docs: docsUrl('links:no-utm-internal'),
      })
    }
    return issues
  },
})

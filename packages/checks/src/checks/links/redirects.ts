import type { CheckContext, Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'
import { resolveUrl } from '../../net'

function internalLinks(ctx: CheckContext): { href: string, resolved: string }[] {
  const origin = new URL(ctx.site.url).origin
  const seen = new Set<string>()
  const result: { href: string, resolved: string }[] = []
  for (const link of ctx.page!.links) {
    try {
      const url = new URL(link.href, ctx.page!.url)
      if (url.origin !== origin) continue
      url.hash = ''
      if (seen.has(url.toString())) continue
      seen.add(url.toString())
      result.push({ href: link.href, resolved: url.toString() })
    } catch {
      continue
    }
  }
  return result
}

export const permanentRedirects = defineCheck({
  id: 'links:permanent-redirects',
  category: 'links',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('links:permanent-redirects'),
  async run(ctx) {
    const issues: Issue[] = []
    for (const link of internalLinks(ctx)) {
      const { hops, firstStatus } = await resolveUrl(ctx.fetcher, link.resolved)
      if (hops === 0) continue
      if (firstStatus === 302 || firstStatus === 307) {
        issues.push({
          checkId: 'links:permanent-redirects',
          severity: 'warn',
          message: `Internal link "${link.href}" goes through a temporary ${firstStatus} redirect`,
          url: ctx.page!.url,
          selector: `a[href="${link.href}"]`,
          suggestion: 'Use a permanent 301/308 redirect so link equity is passed, or link to the final URL',
          docs: docsUrl('links:permanent-redirects'),
        })
      }
    }
    return issues
  },
})

export const trailingSlashConsistent = defineCheck({
  id: 'links:trailing-slash-consistent',
  category: 'links',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('links:trailing-slash-consistent'),
  async run(ctx) {
    const pages = (ctx.pages ?? []).filter(p => p.statusCode === 200)
    const paths = pages
      .map((p) => {
        try {
          return new URL(p.url).pathname
        } catch {
          return null
        }
      })
      .filter((p): p is string => p !== null && p !== '/')
    const withSlash = paths.filter(p => p.endsWith('/'))
    const withoutSlash = paths.filter(p => !p.endsWith('/'))
    if (withSlash.length === 0 || withoutSlash.length === 0) return []
    const minority = withSlash.length < withoutSlash.length ? withSlash : withoutSlash
    const majorityStyle = withSlash.length < withoutSlash.length ? 'without' : 'with'
    return minority.map(path => ({
      checkId: 'links:trailing-slash-consistent',
      severity: 'warn' as const,
      message: `"${path}" diverges from the dominant URL style (${majorityStyle} trailing slash)`,
      url: `${new URL(ctx.site.url).origin}${path}`,
      suggestion: 'Pick one trailing-slash style and redirect the other to avoid duplicate URLs',
      docs: docsUrl('links:trailing-slash-consistent'),
    }))
  },
})

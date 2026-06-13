import type { CheckContext } from '@ranklint/core'
import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'
import { resolveUrl } from '../../net'

function internalLinks(ctx: CheckContext): { href: string, resolved: string }[] {
  const origin = new URL(ctx.site.url).origin
  const seen = new Set<string>()
  const result: { href: string, resolved: string }[] = []
  for (const link of ctx.page!.links) {
    let resolved: URL
    try {
      resolved = new URL(link.href, ctx.page!.url)
    } catch {
      continue
    }
    if (resolved.origin !== origin) continue
    resolved.hash = ''
    const key = resolved.toString()
    if (seen.has(key)) continue
    seen.add(key)
    result.push({ href: link.href, resolved: key })
  }
  return result
}

export const noBroken = defineCheck({
  id: 'links:no-broken',
  category: 'links',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('links:no-broken'),
  async run(ctx) {
    const issues = []
    for (const link of internalLinks(ctx)) {
      const { status } = await resolveUrl(ctx.fetcher, link.resolved)
      if (status >= 400 || status === 0) {
        issues.push({
          checkId: 'links:no-broken',
          severity: 'error' as const,
          message: `Internal link "${link.href}" responds with ${status || 'network error'}`,
          url: ctx.page!.url,
          selector: `a[href="${link.href}"]`,
          suggestion: 'Fix or remove the broken link',
          docs: docsUrl('links:no-broken'),
        })
      }
    }
    return issues
  },
})

export const noRedirectChain = defineCheck({
  id: 'links:no-redirect-chain',
  category: 'links',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('links:no-redirect-chain'),
  optionsSchema: z.object({
    maxHops: z.number().int().nonnegative().optional(),
  }),
  async run(ctx) {
    const { maxHops = 1 } = ctx.config.options as { maxHops?: number }
    const issues = []
    for (const link of internalLinks(ctx)) {
      const { hops } = await resolveUrl(ctx.fetcher, link.resolved)
      if (hops > maxHops) {
        issues.push({
          checkId: 'links:no-redirect-chain',
          severity: 'warn' as const,
          message: `Internal link "${link.href}" goes through ${hops} redirects (max ${maxHops})`,
          url: ctx.page!.url,
          selector: `a[href="${link.href}"]`,
          suggestion: 'Link directly to the final URL',
          docs: docsUrl('links:no-redirect-chain'),
        })
      }
    }
    return issues
  },
})

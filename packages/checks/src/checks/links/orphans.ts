import type { Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

export const noOrphans = defineCheck({
  id: 'links:no-orphans',
  category: 'links',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('links:no-orphans'),
  async run(ctx) {
    const origin = new URL(ctx.site.url).origin
    let xml: string
    try {
      const res = await globalThis.fetch(`${origin}/sitemap.xml`)
      if (!res.ok) return []
      xml = await res.text()
    } catch {
      return []
    }
    const sitemapPaths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => {
        try {
          return new URL(m[1]!).pathname
        } catch {
          return null
        }
      })
      .filter((p): p is string => p !== null)

    const linked = new Set<string>()
    for (const page of ctx.pages ?? []) {
      for (const link of page.links) {
        try {
          const u = new URL(link.href, page.url)
          if (u.origin === origin) linked.add(u.pathname)
        } catch {
          continue
        }
      }
    }

    const issues: Issue[] = []
    for (const path of new Set(sitemapPaths)) {
      if (path === '/' || linked.has(path)) continue
      issues.push({
        checkId: 'links:no-orphans',
        severity: 'warn',
        message: `Page "${path}" is listed in sitemap.xml but no internal link points to it`,
        url: `${origin}${path}`,
        suggestion: 'Link the page from navigation or related content, or remove it from the sitemap',
        docs: docsUrl('links:no-orphans'),
      })
    }
    return issues
  },
})

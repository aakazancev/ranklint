import type { CheckContext, Issue } from '@ranklint/core'
import { getDocument } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

const MAX_UNCRAWLED_PROBES = 100

function crawlOrigin(ctx: CheckContext): string {
  return new URL(ctx.pages?.[0]?.url ?? ctx.site.url).origin
}

async function sitemapPaths(ctx: CheckContext): Promise<string[]> {
  const snapshot = await ctx.fetcher.fetch(`${crawlOrigin(ctx)}/sitemap.xml`)
  if (snapshot.statusCode >= 400 || snapshot.statusCode === 0) return []
  const xml = snapshot.ssrHtml ?? snapshot.html
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => {
      try {
        const url = new URL(match[1]!.trim())
        return url.pathname + url.search
      } catch {
        return ''
      }
    })
    .filter(Boolean)
}

function pathOf(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.pathname + parsed.search
  } catch {
    return url
  }
}

function isNoindex(page: { headers: Record<string, string> }, doc: Document): boolean {
  if ((page.headers['x-robots-tag'] ?? '').includes('noindex')) return true
  const meta = doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''
  return meta.includes('noindex')
}

export const sitemapNoNoindex = defineCheck({
  id: 'sitemap:no-noindex',
  category: 'indexability',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('sitemap:no-noindex'),
  async run(ctx) {
    const locs = new Set(await sitemapPaths(ctx))
    if (locs.size === 0) return []
    const issues: Issue[] = []
    for (const page of ctx.pages ?? []) {
      if (page.statusCode !== 200 || !locs.has(pathOf(page.url))) continue
      if (!isNoindex(page, getDocument(page))) continue
      issues.push({
        checkId: 'sitemap:no-noindex',
        severity: 'error',
        message: 'Page is listed in sitemap.xml but marked noindex',
        url: page.url,
        selector: 'meta[name="robots"]',
        suggestion: 'Remove the page from the sitemap or drop the noindex — the combination wastes crawl budget and confuses search engines',
        docs: docsUrl('sitemap:no-noindex'),
      })
    }
    return issues
  },
})

export const sitemapReachable = defineCheck({
  id: 'sitemap:reachable',
  category: 'indexability',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('sitemap:reachable'),
  async run(ctx) {
    const locs = await sitemapPaths(ctx)
    if (locs.length === 0) return []
    const origin = crawlOrigin(ctx)
    const byPath = new Map((ctx.pages ?? []).map(page => [pathOf(page.url), page.statusCode]))
    const issues: Issue[] = []
    let probes = 0
    for (const loc of locs) {
      let status = byPath.get(loc)
      if (status === undefined) {
        if (probes >= MAX_UNCRAWLED_PROBES) continue
        probes++
        try {
          status = (await ctx.fetcher.head(`${origin}${loc}`)).statusCode
        } catch {
          status = 0
        }
      }
      if (status !== undefined && status < 400 && status !== 0) continue
      issues.push({
        checkId: 'sitemap:reachable',
        severity: 'error',
        message: `Sitemap lists ${loc} but it responds with ${status || 'network error'}`,
        url: `${origin}${loc}`,
        suggestion: 'Remove dead URLs from the sitemap — search engines treat them as low sitemap quality',
        docs: docsUrl('sitemap:reachable'),
      })
    }
    return issues
  },
})

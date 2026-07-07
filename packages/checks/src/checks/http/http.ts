import type { Issue } from '@ranklint/core'
import { getDocument, mostSpecific, routePatternOf } from '@ranklint/core'
import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

const PROBE_PATH = '/__ranklint-soft-404-probe'
const NOT_FOUND_PATTERNS = /not found|page does not exist|страница не найдена|ничего не найдено/i

export const noSoft404 = defineCheck({
  id: 'http:no-soft-404',
  category: 'http',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('http:no-soft-404'),
  async run(ctx) {
    const issues: Issue[] = []
    const origin = new URL(ctx.site.url).origin
    try {
      const probe = await ctx.fetcher.head(`${origin}${PROBE_PATH}`)
      if (probe.statusCode === 200) {
        issues.push({
          checkId: 'http:no-soft-404',
          severity: 'error',
          message: 'A guaranteed-nonexistent URL responds with 200 — missing pages are soft 404s',
          url: `${origin}${PROBE_PATH}`,
          suggestion: 'Return a real 404 status for unknown URLs; soft 404s waste crawl budget and pollute the index',
          docs: docsUrl('http:no-soft-404'),
        })
      }
    } catch {
      return issues
    }
    for (const page of ctx.pages ?? []) {
      if (page.statusCode !== 200) continue
      const title = getDocument(page).querySelector('title')?.textContent ?? ''
      if (NOT_FOUND_PATTERNS.test(title)) {
        issues.push({
          checkId: 'http:no-soft-404',
          severity: 'error',
          message: `Page responds 200 but its title looks like an error page: "${title.trim()}"`,
          url: page.url,
          selector: 'title',
          suggestion: 'Serve the proper 404 status code for missing content',
          docs: docsUrl('http:no-soft-404'),
        })
      }
    }
    return issues
  },
})

export const xRobotsConsistent = defineCheck({
  id: 'http:x-robots-consistent',
  category: 'http',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('http:x-robots-consistent'),
  async run(ctx) {
    const header = (ctx.page!.headers['x-robots-tag'] ?? '').toLowerCase()
    const meta = (ctx.document?.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '').toLowerCase()
    if (!header || !meta) return []
    const headerNoindex = header.includes('noindex')
    const metaNoindex = meta.includes('noindex')
    if (headerNoindex === metaNoindex) return []
    return [{
      checkId: 'http:x-robots-consistent',
      severity: 'error',
      message: `X-Robots-Tag header ("${header}") conflicts with meta robots ("${meta}")`,
      url: ctx.page!.url,
      selector: 'meta[name="robots"]',
      suggestion: 'Align the header and the meta tag — search engines apply the most restrictive rule',
      docs: docsUrl('http:x-robots-consistent'),
    }]
  },
})

function p75(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.round((sorted.length - 1) * 0.75))]!
}

export const ttfbBudget = defineCheck({
  id: 'http:ttfb-budget',
  category: 'http',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('http:ttfb-budget'),
  optionsSchema: z.object({
    p75: z.number().positive().optional(),
    budgets: z.record(z.string(), z.number().positive()).optional(),
  }),
  async run(ctx) {
    const { p75: defaultBudget = 800, budgets } = ctx.config.options as {
      p75?: number
      budgets?: Record<string, number>
    }
    const pages = (ctx.pages ?? []).filter(p => p.statusCode === 200 && p.ttfb > 0)
    if (pages.length === 0) return []
    const groups = new Map<string, { budget: number, values: number[] }>()
    for (const page of pages) {
      let path: string
      try {
        path = new URL(page.url).pathname
      } catch {
        continue
      }
      const pattern = budgets ? mostSpecific(Object.keys(budgets), path) : undefined
      const key = pattern ?? routePatternOf(path)
      const budget = pattern ? budgets![pattern]! : defaultBudget
      const group = groups.get(key) ?? { budget, values: [] }
      group.values.push(page.ttfb)
      groups.set(key, group)
    }
    const issues: Issue[] = []
    for (const [pattern, group] of groups) {
      const value = p75(group.values)
      if (value <= group.budget) continue
      issues.push({
        checkId: 'http:ttfb-budget',
        severity: 'warn',
        message: `p75 TTFB for ${pattern} is ${value}ms, budget ${group.budget}ms (${group.values.length} pages)`,
        url: ctx.site.url,
        suggestion: 'Investigate server rendering time and caching for this route group',
        docs: docsUrl('http:ttfb-budget'),
      })
    }
    return issues
  },
})

export const viewport = defineCheck({
  id: 'mobile:viewport',
  category: 'http',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('mobile:viewport'),
  async run(ctx) {
    if (ctx.document?.querySelector('meta[name="viewport"]')) return []
    return [{
      checkId: 'mobile:viewport',
      severity: 'error',
      message: 'Page has no viewport meta tag',
      url: ctx.page!.url,
      selector: 'head',
      suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> — required for mobile-first indexing',
      docs: docsUrl('mobile:viewport'),
    }]
  },
})

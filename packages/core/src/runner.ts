import { parseHTML } from 'linkedom'
import type { Check, CrawlStats, Issue, PageFetcher, PageSnapshot, Report, ResolvedRuleOptions, RuleSetting, SiteConfig } from './types'

const domCache = new WeakMap<PageSnapshot, Document>()

export function getDocument(snapshot: PageSnapshot): Document {
  let doc = domCache.get(snapshot)
  if (!doc) {
    doc = parseHTML(snapshot.html).document as unknown as Document
    domCache.set(snapshot, doc)
  }
  return doc
}

function ignoredRules(doc: Document): Set<string> {
  const content = doc.querySelector('meta[name="ranklint:ignore"]')?.getAttribute('content') ?? ''
  return new Set(content.split(',').map(s => s.trim()).filter(Boolean))
}

export interface RunnerInput {
  snapshots: PageSnapshot[]
  checks: Check[]
  rules: Map<string, RuleSetting>
  site: SiteConfig
  fetcher: PageFetcher
  crawlStats: CrawlStats
  crawlIssues?: Issue[]
  truncated?: boolean
  commit?: string
  timestamp?: string
}

function ruleFor(check: Check, rules: Map<string, RuleSetting>): ResolvedRuleOptions | null {
  const rule = rules.get(check.id) ?? { severity: check.severity, options: {} }
  return rule === 'off' ? null : rule
}

function failedIssue(check: Check, e: unknown, url: string): Issue {
  return {
    checkId: 'internal:check-failed',
    severity: 'info',
    message: `Check ${check.id} threw: ${e instanceof Error ? e.message : String(e)}`,
    url,
  }
}

export async function runChecks(input: RunnerInput): Promise<Report> {
  const issues: Issue[] = [...(input.crawlIssues ?? [])]
  let ignoredCount = 0
  const pageChecks = input.checks.filter(c => c.scope === 'page')
  const siteChecks = input.checks.filter(c => c.scope === 'site')

  for (const snapshot of input.snapshots) {
    const doc = getDocument(snapshot)
    const ignored = ignoredRules(doc)
    for (const check of pageChecks) {
      const rule = ruleFor(check, input.rules)
      if (!rule) continue
      if (ignored.has(check.id)) {
        ignoredCount++
        continue
      }
      try {
        const found = await check.run({
          page: snapshot,
          document: doc,
          config: rule,
          site: input.site,
          fetcher: input.fetcher,
        })
        issues.push(...found.map(i => ({ ...i, severity: rule.severity })))
      } catch (e) {
        issues.push(failedIssue(check, e, snapshot.url))
      }
    }
  }

  for (const check of siteChecks) {
    const rule = ruleFor(check, input.rules)
    if (!rule) continue
    try {
      const found = await check.run({
        pages: input.snapshots,
        config: rule,
        site: input.site,
        fetcher: input.fetcher,
      })
      issues.push(...found.map(i => ({ ...i, severity: rule.severity })))
    } catch (e) {
      issues.push(failedIssue(check, e, input.site.url))
    }
  }

  return {
    formatVersion: 1,
    meta: {
      url: input.site.url,
      commit: input.commit,
      timestamp: input.timestamp ?? new Date().toISOString(),
      pagesAudited: input.snapshots.length,
      truncated: input.truncated,
    },
    issues,
    pages: input.snapshots.map((s) => {
      try {
        return new URL(s.url).pathname
      } catch {
        return s.url
      }
    }),
    crawlStats: { ...input.crawlStats, ignored: input.crawlStats.ignored + ignoredCount },
  }
}

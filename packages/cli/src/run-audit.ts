import type { Check, PageFetcher, RanklintUserConfig, Report } from '@ranklint/core'
import { analyzeCrawlBudget, crawl, loadRanklintConfig, resolveRules, runChecks, sampleUrls } from '@ranklint/core'
import { allChecks, ruleRegistry } from '@ranklint/checks'
import { checkThresholds, collectLighthouse, type LighthouseRunner } from './lighthouse'
import { PlaywrightFetcher } from './playwright-fetcher'

export interface RunAuditOptions {
  url: string
  cwd?: string
  profile?: string
  fetcher?: PageFetcher
  config?: RanklintUserConfig
  lighthouseRunner?: LighthouseRunner
}

const REACHABLE_DOCS = 'https://ranklint.dev/rules/links-reachable'

export async function runAudit(opts: RunAuditOptions): Promise<Report> {
  let config: RanklintUserConfig
  if (opts.config) {
    config = opts.config
  } else {
    try {
      config = await loadRanklintConfig({ cwd: opts.cwd, profile: opts.profile })
    } catch (e) {
      if (!(e instanceof Error) || !e.message.includes('not found')) throw e
      config = { site: { url: new URL(opts.url).origin } }
    }
  }
  const checks: Check[] = [...allChecks]
  const registry = new Map(ruleRegistry)
  for (const custom of config.customChecks ?? []) {
    if (registry.has(custom.id)) {
      throw new Error(`Custom check "${custom.id}" clashes with a built-in rule — pick a namespaced id like "myteam:${custom.id.split(':').pop()}"`)
    }
    checks.push(custom)
    registry.set(custom.id, { defaultSeverity: custom.severity })
  }
  const rules = resolveRules(config.rules, registry)
  const viewport = config.crawl?.viewport
    ?? (config.lighthouse?.formFactor === 'mobile' ? { width: 375, height: 812 } : undefined)
  if (config.crawl?.insecureTls) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const fetcher = opts.fetcher ?? new PlaywrightFetcher({ auth: config.crawl?.auth, viewport, insecureTls: config.crawl?.insecureTls })
  try {
    const baseSeeds = config.crawl?.entry?.length
      ? config.crawl.entry.map(path => new URL(path, opts.url).href)
      : [opts.url]
    let seeds = baseSeeds
    if (config.crawl?.strategy === 'sitemap+sample') {
      try {
        const res = await fetch(`${new URL(config.site.url).origin}/sitemap.xml`)
        if (res.ok) {
          const locs = [...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]!)
          const sampled = sampleUrls(locs)
          if (sampled.length > 0) seeds = [...new Set([...baseSeeds, ...sampled])]
        }
      } catch {
        seeds = baseSeeds
      }
    }
    const crawlResult = await crawl(fetcher, seeds, {
      siteUrl: config.site.url,
      apps: config.apps,
      ignore: config.crawl?.ignore,
      concurrency: config.crawl?.concurrency,
      maxPages: config.crawl?.maxPages,
      delay: config.crawl?.delay,
      userAgent: config.crawl?.userAgent,
    })
    const crawlIssues = [...crawlResult.issues]
    const reachableRule = rules.get('links:reachable')
    if (reachableRule && reachableRule !== 'off') {
      for (const entry of crawlResult.reachability) {
        if (entry.statusCode < 400 && entry.statusCode !== 0) continue
        crawlIssues.push({
          checkId: 'links:reachable',
          severity: reachableRule.severity,
          message: `Link into zone "${entry.zone}" responds with ${entry.statusCode || 'network error'}`,
          url: entry.url,
          suggestion: 'The linked page belongs to another app on this domain — fix the link or notify the owning team',
          docs: REACHABLE_DOCS,
        })
      }
    }
    const report = await runChecks({
      snapshots: crawlResult.snapshots,
      checks,
      rules,
      site: { url: config.site.url, apps: config.apps, robots: config.robots },
      fetcher,
      crawlStats: crawlResult.stats,
      crawlIssues,
      truncated: crawlResult.truncated,
    })
    report.crawlBudget = analyzeCrawlBudget(crawlResult.snapshots)
    if (config.lighthouse?.enabled) {
      const { realLighthouseRunner } = await import('./real-lighthouse')
      const runner = opts.lighthouseRunner ?? realLighthouseRunner
      const urls = crawlResult.snapshots
        .filter(s => s.statusCode === 200)
        .map(s => s.url)
        .slice(0, config.lighthouse.maxUrls ?? 5)
      report.lighthouse = await collectLighthouse(urls, config.lighthouse, runner)
      report.issues.push(...checkThresholds(report.lighthouse, config.lighthouse.thresholds))
    }
    return report
  } finally {
    await fetcher.close()
  }
}

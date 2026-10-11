import type { Check, PageFetcher, RanklintUserConfig, Report } from '@ranklint/core'
import { analyzeCrawlBudget, crawl, loadRanklintConfig, resolveRules, runChecks, sampleUrls } from '@ranklint/core'
import { allChecks, ruleRegistry } from '@ranklint/checks'
import { checkThresholds, collectLighthouse, lighthouseTargets, type LighthouseRunner } from './lighthouse'
import { PlaywrightFetcher } from './playwright-fetcher'

export interface RunAuditOptions {
  url: string
  siteUrl?: string
  cwd?: string
  profile?: string
  fetcher?: PageFetcher
  config?: RanklintUserConfig
  lighthouseRunner?: LighthouseRunner
}

const REACHABLE_DOCS = 'https://ranklint.dev/en/cli/zones'

function ignoreStray(reason: unknown): void {
  process.stderr.write(`[ranklint] lighthouse: ignored ${reason instanceof Error ? reason.message : String(reason)}\n`)
}

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
  if (opts.siteUrl) config = { ...config, site: { ...config.site, url: opts.siteUrl } }
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
    process.stderr.write(`[ranklint] crawling from ${seeds.join(', ')}\n`)
    const crawlResult = await crawl(fetcher, seeds, {
      siteUrl: config.site.url,
      apps: config.apps,
      ignore: config.crawl?.ignore,
      concurrency: config.crawl?.concurrency,
      maxPages: config.crawl?.maxPages,
      delay: config.crawl?.delay,
      userAgent: config.crawl?.userAgent,
      respectRobots: config.crawl?.respectRobots,
      entries: baseSeeds,
      onPage: e => process.stderr.write(`[ranklint] ${e.visited}${config.crawl?.maxPages ? `/${config.crawl.maxPages}` : ''} ${e.statusCode} ${e.ms}ms ${e.url}\n`),
    })
    process.stderr.write(`[ranklint] crawl done: ${crawlResult.stats.visited} pages${crawlResult.stats.disallowed ? `, ${crawlResult.stats.disallowed} disallowed by robots.txt` : ''}, running checks\n`)
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
    const checksStarted = Date.now()
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
    process.stderr.write(`[ranklint] checks done: ${report.issues.length} issues in ${((Date.now() - checksStarted) / 1000).toFixed(1)}s\n`)
    if (config.lighthouse?.enabled) {
      const { realLighthouseRunner } = await import('./real-lighthouse')
      const runner = opts.lighthouseRunner ?? realLighthouseRunner
      const crawled = crawlResult.snapshots.filter(s => s.statusCode === 200).map(s => s.url)
      const urls = lighthouseTargets(opts.url, config.lighthouse, crawled)
      process.stderr.write(`[ranklint] lighthouse: ${urls.length} pages\n`)
      process.on('unhandledRejection', ignoreStray)
      report.lighthouse = await collectLighthouse(urls, config.lighthouse, runner, e => process.stderr.write(e.error
        ? `[ranklint] lighthouse ${e.page}/${e.pages} run ${e.run}/${e.runs} failed: ${e.error} ${e.url}\n`
        : `[ranklint] lighthouse ${e.page}/${e.pages} run ${e.run}/${e.runs} ${e.ms}ms${e.metrics.performance === undefined ? '' : ` perf ${e.metrics.performance}`}${e.runtimeError ? ` runtime error ${e.runtimeError}` : ''} ${e.url}\n`,
      ))
      report.issues.push(...checkThresholds(report.lighthouse, config.lighthouse.thresholds))
    }
    return report
  } finally {
    process.off('unhandledRejection', ignoreStray)
    await fetcher.close()
  }
}

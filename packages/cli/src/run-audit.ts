import type { PageFetcher, RanklintUserConfig, Report } from '@ranklint/core'
import { crawl, loadRanklintConfig, resolveRules, runChecks } from '@ranklint/core'
import { allChecks, ruleRegistry } from '@ranklint/checks'
import { PlaywrightFetcher } from './playwright-fetcher'

export interface RunAuditOptions {
  url: string
  cwd?: string
  profile?: string
  fetcher?: PageFetcher
  config?: RanklintUserConfig
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
  const rules = resolveRules(config.rules, ruleRegistry)
  const fetcher = opts.fetcher ?? new PlaywrightFetcher()
  try {
    const crawlResult = await crawl(fetcher, [opts.url], {
      siteUrl: config.site.url,
      apps: config.apps,
      ignore: config.crawl?.ignore,
      concurrency: config.crawl?.concurrency,
      maxPages: config.crawl?.maxPages,
      delay: config.crawl?.delay,
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
    return await runChecks({
      snapshots: crawlResult.snapshots,
      checks: allChecks,
      rules,
      site: { url: config.site.url, apps: config.apps },
      fetcher,
      crawlStats: crawlResult.stats,
      crawlIssues,
      truncated: crawlResult.truncated,
    })
  } finally {
    await fetcher.close()
  }
}

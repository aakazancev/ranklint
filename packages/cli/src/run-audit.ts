import type { PageFetcher, RanklintUserConfig, Report } from '@ranklint/core'
import { crawl, loadRanklintConfig, resolveRules, runChecks } from '@ranklint/core'
import { allChecks, ruleRegistry } from '@ranklint/checks'
import { PlaywrightFetcher } from './playwright-fetcher'

export interface RunAuditOptions {
  url: string
  cwd?: string
  profile?: string
  fetcher?: PageFetcher
}

export async function runAudit(opts: RunAuditOptions): Promise<Report> {
  let config: RanklintUserConfig
  try {
    config = await loadRanklintConfig({ cwd: opts.cwd, profile: opts.profile })
  } catch (e) {
    if (!(e instanceof Error) || !e.message.includes('not found')) throw e
    config = { site: { url: new URL(opts.url).origin } }
  }
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
    return await runChecks({
      snapshots: crawlResult.snapshots,
      checks: allChecks,
      rules: resolveRules(config.rules, ruleRegistry),
      site: { url: config.site.url, apps: config.apps },
      fetcher,
      crawlStats: crawlResult.stats,
      crawlIssues: crawlResult.issues,
      truncated: crawlResult.truncated,
    })
  } finally {
    await fetcher.close()
  }
}

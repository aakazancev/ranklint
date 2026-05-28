import type { CrawlStats, Issue, PageFetcher, PageSnapshot } from './types'
import { normalizeUrl } from './url'
import { classifyUrl, type ZoneConfig } from './zones'

export interface CrawlOptions extends ZoneConfig {
  concurrency?: number
  delay?: number
  maxPages?: number
  timeout?: number
  userAgent?: string
}

export interface CrawlResult {
  snapshots: PageSnapshot[]
  reachability: { url: string, zone: string, statusCode: number }[]
  issues: Issue[]
  stats: CrawlStats
  truncated: boolean
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function crawl(
  fetcher: PageFetcher,
  seeds: string[],
  options: CrawlOptions,
): Promise<CrawlResult> {
  const { concurrency = 5, delay = 0, maxPages = 1000, timeout = 30_000 } = options
  const queue: string[] = []
  const seen = new Set<string>()
  const snapshots: PageSnapshot[] = []
  const reachability: CrawlResult['reachability'] = []
  const issues: Issue[] = []
  const stats: CrawlStats = { visited: 0, skipped: 0, external: 0, ignored: 0 }
  let truncated = false

  const enqueue = (href: string, base: string) => {
    const url = normalizeUrl(href, base)
    if (!url || seen.has(url)) return
    seen.add(url)
    queue.push(url)
  }

  for (const seed of seeds) enqueue(seed, options.siteUrl)

  const processUrl = async (url: string) => {
    const cls = classifyUrl(url, options)
    if (cls.action === 'skip') {
      stats.skipped++
      return
    }
    if (cls.action === 'external') {
      stats.external++
      return
    }
    if (cls.action === 'reachability') {
      try {
        const r = await fetcher.head(url)
        reachability.push({ url, zone: cls.zone, statusCode: r.statusCode })
      } catch {
        reachability.push({ url, zone: cls.zone, statusCode: 0 })
      }
      return
    }
    if (snapshots.length >= maxPages) {
      truncated = true
      return
    }
    let snapshot: PageSnapshot
    try {
      snapshot = await withTimeout(fetcher.fetch(url, { userAgent: options.userAgent }), timeout)
    } catch (e) {
      snapshot = { url, html: '', statusCode: 0, headers: {}, ttfb: 0, links: [] }
      issues.push({
        checkId: 'crawl:timeout',
        severity: 'warn',
        message: e instanceof Error ? e.message : String(e),
        url,
      })
    }
    snapshots.push(snapshot)
    stats.visited++
    for (const link of snapshot.links) enqueue(link.href, url)
    if (delay > 0) await sleep(delay)
  }

  await new Promise<void>((resolve) => {
    let active = 0
    const next = () => {
      if (queue.length === 0 && active === 0) return resolve()
      while (active < concurrency && queue.length > 0) {
        const url = queue.shift()!
        active++
        processUrl(url).finally(() => {
          active--
          next()
        })
      }
    }
    next()
  })

  return { snapshots, reachability, issues, stats, truncated }
}

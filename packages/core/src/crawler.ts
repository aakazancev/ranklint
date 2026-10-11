import { isPathDisallowed, parseRobotsTxt, type ParsedRobots } from './robots'
import type { CrawlStats, Issue, PageFetcher, PageSnapshot } from './types'
import { normalizeUrl } from './url'
import { classifyUrl, type ZoneConfig } from './zones'

export interface CrawlOptions extends ZoneConfig {
  concurrency?: number
  delay?: number
  maxPages?: number
  timeout?: number
  userAgent?: string
  respectRobots?: boolean
  entries?: string[]
  onPage?: (event: CrawlProgressEvent) => void
}

export interface CrawlProgressEvent {
  url: string
  statusCode: number
  ms: number
  visited: number
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

async function loadRobots(fetcher: PageFetcher, siteUrl: string, timeout: number, userAgent?: string): Promise<ParsedRobots | undefined> {
  try {
    const snap = await withTimeout(fetcher.fetch(`${new URL(siteUrl).origin}/robots.txt`, { userAgent }), timeout)
    return snap.statusCode === 200 ? parseRobotsTxt(snap.ssrHtml ?? snap.html) : undefined
  } catch {
    return undefined
  }
}

function isDisallowed(robots: ParsedRobots, url: string, userAgent?: string): boolean {
  const { pathname, search } = new URL(url)
  return isPathDisallowed(robots, pathname + search, userAgent ?? '*')
}

export async function crawl(
  fetcher: PageFetcher,
  seeds: string[],
  options: CrawlOptions,
): Promise<CrawlResult> {
  const { concurrency = 5, delay = 0, maxPages = 1000, timeout = 30_000, respectRobots = true } = options
  const queue: string[] = []
  const seen = new Set<string>()
  const snapshots: PageSnapshot[] = []
  const reachability: CrawlResult['reachability'] = []
  const issues: Issue[] = []
  const stats: Required<CrawlStats> = { visited: 0, skipped: 0, external: 0, ignored: 0, disallowed: 0 }
  let truncated = false

  const enqueue = (href: string, base: string) => {
    const url = normalizeUrl(href, base)
    if (!url || seen.has(url)) return
    seen.add(url)
    queue.push(url)
  }

  for (const seed of seeds) enqueue(seed, options.siteUrl)
  const entries = new Set(options.entries?.map(e => normalizeUrl(e, options.siteUrl)) ?? queue)
  const robots = respectRobots ? await loadRobots(fetcher, options.siteUrl, timeout, options.userAgent) : undefined

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
        const r = await withTimeout(fetcher.head(url), timeout)
        reachability.push({ url, zone: cls.zone, statusCode: r.statusCode })
      } catch {
        reachability.push({ url, zone: cls.zone, statusCode: 0 })
      }
      return
    }
    if (robots && !entries.has(url) && isDisallowed(robots, url, options.userAgent)) {
      stats.disallowed++
      return
    }
    if (snapshots.length >= maxPages) {
      truncated = true
      return
    }
    let snapshot: PageSnapshot
    const started = Date.now()
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
    const finalUrl = snapshot.finalUrl ?? url
    const siteOrigin = new URL(options.siteUrl).origin
    const finalKey = normalizeUrl(finalUrl, url)
    if (new URL(finalUrl).origin !== siteOrigin) {
      if (entries.has(url)) {
        issues.push({
          checkId: 'crawl:entry-redirect',
          severity: 'error',
          message: `Entry ${url} redirects to ${finalUrl}, outside ${siteOrigin}`,
          url,
          suggestion: `Set site.url / --url to ${new URL(finalUrl).origin}`,
        })
      } else {
        stats.external++
      }
    } else if (!finalKey || finalKey === url || !seen.has(finalKey)) {
      if (finalKey) seen.add(finalKey)
      const page = finalKey && finalKey !== url ? { ...snapshot, url: finalKey } : snapshot
      snapshots.push(page)
      stats.visited++
      options.onPage?.({ url: page.url, statusCode: snapshot.statusCode, ms: Date.now() - started, visited: stats.visited })
      for (const link of snapshot.links) enqueue(link.href, finalUrl)
    }
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

import { getDocument, HttpFetcher, type Issue, type PageFetcher, type SiteConfig } from '@ranklint/core'
import { allChecks } from '@ranklint/checks'
import { watch as chokidarWatch } from 'chokidar'

const SLOW_CHECKS = new Set([
  'canonical:valid',
  'links:no-broken',
  'links:no-redirect-chain',
  'hreflang:valid-targets',
])

export function fileToRoute(relativePath: string): string | null {
  if (!relativePath.endsWith('.vue') || relativePath.includes('[')) return null
  const route = `/${relativePath.replace(/\.vue$/, '')}`
  return route === '/index' ? '/' : route.replace(/\/index$/, '')
}

export interface DynamicRoute {
  pattern: string
  regex: RegExp
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|\\]/g, String.raw`\$&`)
}

export function fileToDynamicRoute(relativePath: string): DynamicRoute | null {
  if (!relativePath.endsWith('.vue') || !relativePath.includes('[')) return null
  let route = `/${relativePath.replace(/\.vue$/, '')}`
  route = route === '/index' ? '/' : route.replace(/\/index$/, '')
  const source = route
    .split('/')
    .map(segment => segment.replace(/\[\.\.\.[^\]]*\]|\[[^\]]*\]|[^[\]]+/g, part =>
      part.startsWith('[...') ? '.+' : part.startsWith('[') ? '[^/]+' : escapeRegExp(part)))
    .join('/')
  return { pattern: route, regex: new RegExp(`^${source}/?$`) }
}

export async function sitemapPaths(baseUrl: string, fetcher: PageFetcher): Promise<string[]> {
  const snapshot = await fetcher.fetch(new URL('/sitemap.xml', baseUrl).toString())
  if (snapshot.statusCode !== 200) return []
  return [...snapshot.html.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => {
      try {
        return new URL(match[1]!).pathname
      } catch {
        return ''
      }
    })
    .filter(Boolean)
}

export async function runFastChecks(route: string, baseUrl: string, fetcher: PageFetcher): Promise<Issue[]> {
  const url = new URL(route, baseUrl).toString()
  const snapshot = await fetcher.fetch(url)
  if (snapshot.statusCode !== 200) {
    return [{
      checkId: 'watch:unreachable',
      severity: 'warn',
      message: `Dev server responded ${snapshot.statusCode} for ${route}`,
      url,
    }]
  }
  const site: SiteConfig = { url: new URL(baseUrl).origin }
  const document = getDocument(snapshot)
  const issues: Issue[] = []
  for (const check of allChecks) {
    if (check.scope !== 'page' || SLOW_CHECKS.has(check.id)) continue
    try {
      issues.push(...await check.run({
        page: snapshot,
        document,
        config: { severity: check.severity, options: {} },
        site,
        fetcher,
      }))
    } catch {
      continue
    }
  }
  return issues
}

export function formatIssues(route: string, issues: Issue[]): string {
  if (issues.length === 0) return `${route}\n  clean\n`
  const lines = [route]
  for (const issue of issues) {
    lines.push(`  ${issue.severity.padEnd(5)} ${issue.checkId.padEnd(28)} ${issue.message}`)
  }
  lines.push('')
  return lines.join('\n')
}

export interface WatchOptions {
  pagesDir: string
  baseUrl: string
  fetcher?: PageFetcher
  debounceMs?: number
  onReport?: (route: string, issues: Issue[]) => void
}

export function startWatch(options: WatchOptions): { close: () => Promise<void> } {
  const fetcher = options.fetcher ?? new HttpFetcher()
  const debounceMs = options.debounceMs ?? 300
  const timers = new Map<string, NodeJS.Timeout>()
  const report = options.onReport
    ?? ((route: string, issues: Issue[]) => process.stdout.write(formatIssues(route, issues)))

  let sitemapCache: Promise<string[]> | undefined
  const resolveDynamic = async (dynamic: DynamicRoute): Promise<string[]> => {
    sitemapCache ??= sitemapPaths(options.baseUrl, fetcher).catch(() => [])
    return (await sitemapCache).filter(path => dynamic.regex.test(path)).slice(0, 3)
  }

  const checkRoutes = async (label: string, routes: string[]) => {
    if (routes.length === 0) {
      report(label, [{
        checkId: 'watch:no-sample-url',
        severity: 'warn',
        message: `No sitemap URL matches "${label}" — cannot check the dynamic route`,
        url: label,
        suggestion: 'Add the route to the sitemap (e.g. via an async source) so watch can sample it',
      }])
      return
    }
    for (const route of routes) {
      report(route, await runFastChecks(route, options.baseUrl, fetcher))
    }
  }

  const watcher = chokidarWatch('.', { cwd: options.pagesDir, ignoreInitial: true })
  watcher.on('all', (_event, relativePath) => {
    const route = fileToRoute(relativePath)
    const dynamic = route === null ? fileToDynamicRoute(relativePath) : null
    if (route === null && dynamic === null) return
    const key = route ?? dynamic!.pattern
    clearTimeout(timers.get(key))
    timers.set(key, setTimeout(() => {
      const run = route === null
        ? resolveDynamic(dynamic!).then(routes => checkRoutes(dynamic!.pattern, routes))
        : runFastChecks(route, options.baseUrl, fetcher).then(issues => report(route, issues))
      run.catch(() => report(key, []))
    }, debounceMs))
  })

  return {
    close: async () => {
      for (const timer of timers.values()) clearTimeout(timer)
      await watcher.close()
      await fetcher.close()
    },
  }
}

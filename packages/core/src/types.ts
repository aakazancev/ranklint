export type Severity = 'error' | 'warn' | 'info'
export type CheckScope = 'page' | 'site'
export type CheckCategory =
  | 'meta' | 'headings' | 'links' | 'i18n' | 'structured-data'
  | 'images' | 'robots' | 'indexability' | 'http'

export interface PageLink {
  href: string
  text: string
  rel?: string
}

export interface PageSnapshot {
  url: string
  html: string
  ssrHtml?: string
  statusCode: number
  headers: Record<string, string>
  ttfb: number
  links: PageLink[]
}

export interface PageFetcher {
  fetch(url: string, opts?: { userAgent?: string }): Promise<PageSnapshot>
  head(url: string): Promise<{ statusCode: number, headers: Record<string, string> }>
  close(): Promise<void>
}

export interface AppZone {
  paths: string[]
  owner?: 'self' | 'external'
  checks?: string[]
}

export interface SiteConfig {
  url: string
  name?: string
  apps?: Record<string, AppZone>
}

export interface ResolvedRuleOptions {
  severity: Severity
  options: Record<string, unknown>
}

export type RuleSetting = ResolvedRuleOptions | 'off'

export interface CheckContext {
  page?: PageSnapshot
  pages?: PageSnapshot[]
  document?: Document
  config: ResolvedRuleOptions
  site: SiteConfig
  fetcher: PageFetcher
}

export interface Check {
  id: string
  category: CheckCategory
  severity: Severity
  scope: CheckScope
  run(ctx: CheckContext): Promise<Issue[]>
}

export interface Issue {
  checkId: string
  severity: Severity
  message: string
  url: string
  selector?: string
  suggestion?: string
  docs?: string
}

export interface CrawlStats {
  visited: number
  skipped: number
  external: number
  ignored: number
}

export interface Report {
  formatVersion: 1
  meta: {
    url: string
    commit?: string
    timestamp: string
    pagesAudited: number
    truncated?: boolean
  }
  issues: Issue[]
  lighthouse?: unknown
  crawlStats: CrawlStats
}

export interface DiffResult {
  newIssues: Issue[]
  fixedIssues: Issue[]
  lighthouse?: { url: string, metric: string, base: number, current: number }[]
  pagesDelta: { added: string[], removed: string[] }
}

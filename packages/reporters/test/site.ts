import type { Issue, Report } from '@ranklint/core'

export const ORIGIN = 'https://example.com'

export const PAGES = [
  '/',
  ...[1, 2, 3, 4, 5, 6].map(i => `/blog/${i}`),
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `/docs/${i}`),
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => `/de/shop/${i}`),
  ...[1, 2, 3].map(i => `/pt-br/help/${i}`),
  '/abc/1',
  '/abc/2',
]

export function issue(checkId: string, severity: Issue['severity'], path: string, message = 'm', extra: Partial<Issue> = {}): Issue {
  return { checkId, severity, message, url: `${ORIGIN}${path}`, suggestion: `fix ${checkId}`, docs: `https://ranklint.dev/rules/${checkId}`, ...extra }
}

export function report(timestamp: string, issues: Issue[], extra: Partial<Report> = {}): Report {
  return {
    formatVersion: 1,
    meta: { url: ORIGIN, timestamp, pagesAudited: PAGES.length },
    issues,
    pages: PAGES,
    crawlStats: { visited: PAGES.length, skipped: 0, external: 0, ignored: 0 },
    ...extra,
  }
}

export const altIssues = ['/', ...PAGES.filter(p => p.startsWith('/docs/')), '/de/shop/1']
  .map(p => issue('images:alt-required', 'warn', p, 'Image has no alt', { selector: 'img.logo' }))

export const titleIssues = [1, 2, 3, 4, 5].map(i => issue('meta:title-length', 'error', `/blog/${i}`, 'Title is too short'))

export const h1Issues = [1, 2, 3, 4].map(i => issue('headings:single-h1', 'error', `/docs/${i}`, 'No h1'))

export const orphanIssues = [1, 2, 3, 4, 5].map(i => issue('links:no-orphans', 'info', `/docs/${i}`, 'Nobody links here'))

export const current = report('2026-07-02T10:30:00.000Z', [...altIssues, ...titleIssues, ...h1Issues, ...orphanIssues])

export const previous = report('2026-07-01T09:15:00.000Z', [...altIssues, ...h1Issues, issue('meta:description-required', 'error', '/abc/1', 'No description')])

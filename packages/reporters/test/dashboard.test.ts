import type { Issue, Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { dashboard } from '../src/dashboard'
import { html } from '../src/html'

function issue(checkId: string, severity: Issue['severity'], path: string, message = 'm'): Issue {
  return { checkId, severity, message, url: `https://x.com${path}`, suggestion: 's' }
}

function report(timestamp: string, issues: Issue[], extra: Partial<Report> = {}): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp, pagesAudited: 10 },
    issues,
    crawlStats: { visited: 10, skipped: 0, external: 0, ignored: 0 },
    ...extra,
  }
}

const lighthouse: Report['lighthouse'] = [{
  url: 'https://x.com/<a>',
  runs: 3,
  aggregation: 'median',
  metrics: { performance: 95, seo: 72, accessibility: 40, bestPractices: 100, lcp: 2100, cls: 0.05, tbt: 150 },
  lcpElement: { type: 'image', suggestion: 'Preload <img>' },
}]

describe('html reporter web vitals', () => {
  it('omits the section without crux and lighthouse', () => {
    expect(html(report('t', []))).not.toContain('Web Vitals')
  })

  it('renders crux tiles with google ratings', () => {
    const out = html(report('t', [issue('meta:title', 'error', '/')], { crux: { lcp: 2000, inp: 600, cls: 0.15 } }))
    expect(out).toContain('Web Vitals')
    expect(out).toMatch(/LCP[\s\S]*?2000 ms[\s\S]*?good/)
    expect(out).toMatch(/INP[\s\S]*?600 ms[\s\S]*?poor/)
    expect(out).toMatch(/CLS[\s\S]*?0\.15[\s\S]*?needs improvement/)
    expect(out.indexOf('Web Vitals')).toBeLessThan(out.indexOf('meta:title'))
    expect(out).not.toContain('<th>Performance</th>')
  })

  it('renders an escaped lighthouse table with colored scores', () => {
    const out = html(report('t', [], { lighthouse }))
    expect(out).toContain('<th>Performance</th>')
    expect(out).toContain('https://x.com/&lt;a&gt;')
    expect(out).not.toContain('https://x.com/<a>')
    expect(out).toContain('<td class="score good">95</td>')
    expect(out).toContain('<td class="score average">72</td>')
    expect(out).toContain('<td class="score poor">40</td>')
    expect(out).toContain('median of 3 runs')
    expect(out).toContain('Preload &lt;img&gt;')
    expect(out).not.toContain('CrUX')
  })
})

describe('dashboard', () => {
  it('renders a single run without deltas and charts', () => {
    const out = dashboard([{ key: 'a', report: report('2026-07-01T00:00:00.000Z', [issue('meta:title', 'error', '/')]) }])
    expect(out).toContain('<!doctype html>')
    expect(out).toContain('https://x.com')
    expect(out).toContain('2026-07-01T00:00:00.000Z')
    expect(out).not.toContain('<svg')
    expect(out).not.toContain('class="delta')
    expect(out).toContain('href="runs/a.html"')
    expect(out).toContain('prefers-color-scheme: dark')
    expect(out).not.toMatch(/<(script|link)\b/)
    expect(out).not.toContain('Lighthouse performance')
    expect(out).not.toContain('Run audit')
  })

  it('renders a run audit link when runUrl is set', () => {
    const out = dashboard([{ key: 'a', report: report('2026-07-01T00:00:00.000Z', []) }], { runUrl: 'https://ci.example/new?a=1&b=2' })
    expect(out).toContain('<a class="run-audit" href="https://ci.example/new?a=1&amp;b=2" target="_blank" rel="noopener">Run audit</a>')
  })

  it('renders an empty state', () => {
    expect(dashboard([])).toContain('No stored reports')
  })

  it('sorts by timestamp and renders deltas, diff, charts and links', () => {
    const older = report('2026-07-01T00:00:00.000Z', [
      issue('meta:title', 'error', '/a'),
      issue('meta:title', 'error', '/b'),
      issue('links:broken', 'warn', '/c'),
    ], { lighthouse, crux: { lcp: 3000, inp: 150, cls: 0.05 } })
    const newer = report('2026-07-02T00:00:00.000Z', [
      issue('meta:title', 'error', '/a'),
      issue('headings:h1', 'warn', '/d', 'bad <h1> & co'),
      issue('headings:h1', 'warn', '/e'),
    ], { lighthouse, crux: { lcp: 2000, inp: 150, cls: 0.3 } })
    const out = dashboard(
      [{ key: 'new', report: newer }, { key: 'old', report: older }],
      { runHref: key => `archive/${key}/` },
    )
    expect(out).toContain('2026-07-02T00:00:00.000Z')
    expect(out).toContain('<span class="delta good">−1</span>')
    expect(out).toContain('<span class="delta bad">+1</span>')
    expect(out).toContain('tile-label">CrUX LCP</span><b>2000 ms</b> <span class="delta good">−1000</span>')
    expect(out).toContain('New issues (2)')
    expect(out).toContain('Fixed issues (2)')
    expect(out).toContain('bad &lt;h1&gt; &amp; co')
    expect(out).not.toContain('bad <h1>')
    expect(out.match(/<svg/g)?.length).toBe(5)
    expect(out).toContain('href="archive/new/"')
    expect(out).toContain('href="archive/old/"')
    expect(out.indexOf('href="archive/new/"')).toBeLessThan(out.indexOf('href="archive/old/"'))
    expect(out).toMatch(/<code>headings:h1<\/code>[\s\S]*?warn[\s\S]*?2/)
  })

  it('rounds the chart scale up to an even integer', () => {
    const out = dashboard([
      { key: 'a', report: report('2026-07-01T00:00:00.000Z', [issue('meta:title', 'error', '/a')]) },
      { key: 'b', report: report('2026-07-02T00:00:00.000Z', [1, 2, 3].map(i => issue('meta:title', 'error', `/${i}`))) },
    ])
    expect(out).toMatch(/text-anchor="end">2<\/text>/)
    expect(out).toMatch(/text-anchor="end">4<\/text>/)
    expect(out).not.toMatch(/text-anchor="end">3<\/text>/)
  })

  it('caps diff lists at 20 items', () => {
    const many = Array.from({ length: 25 }, (_, i) => issue('meta:title', 'error', `/${i}`))
    const out = dashboard([
      { key: 'a', report: report('2026-07-01T00:00:00.000Z', []) },
      { key: 'b', report: report('2026-07-02T00:00:00.000Z', many) },
    ])
    expect(out).toContain('New issues (25)')
    expect(out).toContain('and 5 more')
    expect(out).toContain('<svg')
    expect(out).not.toContain('tile-label">CrUX')
    expect(out).not.toContain('CrUX LCP, p75')
  })
})

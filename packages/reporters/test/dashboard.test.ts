import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { dashboard } from '../src/dashboard'
import { html } from '../src/html'
import { current, issue, previous, report } from './site'

const lighthouse: Report['lighthouse'] = [{
  url: 'https://example.com/<a>',
  runs: 3,
  aggregation: 'median',
  metrics: { performance: 95, seo: 72, accessibility: 40, bestPractices: 100, lcp: 2100, cls: 0.05, tbt: 150 },
  lcpElement: { type: 'image', suggestion: 'Preload <img>' },
}]

function markup(out: string): string {
  return out.replace(/<script\b[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '')
}

function externalScripts(out: string): string[] {
  return [...out.matchAll(/<script\b[^>]*\bsrc=/g)].map(m => m[0])
}

describe('html report', () => {
  it('renders the page view with brand fonts and no external scripts', () => {
    const out = html(current)
    expect(out).toContain('<!doctype html>')
    expect(out).toContain('rank<span class="acid">lint</span>')
    expect(out).toContain('data-mode="page"')
    expect(out).toContain('fonts.googleapis.com')
    expect(out).toContain('id="issues-data"')
    expect(externalScripts(out)).toEqual([])
    expect(markup(out)).not.toContain('class="new"')
    expect(out).not.toContain('← Dashboard')
  })

  it('marks new issues and shows deltas against the previous run', () => {
    const out = html(current, { previous, dashboardHref: '../index.html' })
    expect(markup(out)).toContain('class="new"')
    expect(out).toContain('id="ex-new"')
    expect(out).toContain('href="../index.html"')
    expect(out).toContain('vs 1 Jul, 09:15 UTC')
  })

  it('omits web vitals without crux and lighthouse', () => {
    const out = html(report('t', []))
    expect(out).not.toContain('Lighthouse by page')
    expect(out).not.toContain('CrUX')
    expect(out).toContain('No issues found')
  })

  it('renders crux values with google ratings', () => {
    const out = html(report('t', [issue('meta:title-length', 'error', '/')], { crux: { lcp: 2000, inp: 600, cls: 0.15 } }))
    expect(out).toMatch(/LCP[\s\S]*?2000 ms[\s\S]*?good/)
    expect(out).toMatch(/INP[\s\S]*?600 ms[\s\S]*?poor/)
    expect(out).toMatch(/CLS[\s\S]*?0\.15[\s\S]*?needs improvement/)
  })

  it('renders an escaped lighthouse list', () => {
    const out = html(report('t', [], { lighthouse }))
    expect(out).toContain('Lighthouse by page')
    expect(out).toContain('/&lt;a&gt;')
    expect(out).not.toContain('/<a>')
    expect(out).toContain('Preload &lt;img&gt;')
    expect(out).toContain('median of 3 runs')
  })

  it('links lighthouse rows to page cards by the same id for encoded paths', () => {
    const path = '/%D0%BA%D0%B0%D1%82%D0%B0%D0%BB%D0%BE%D0%B3/a%20b'
    const out = html(report('t', [issue('meta:title-length', 'error', path)], { lighthouse: [{ ...lighthouse![0]!, url: `https://example.com${path}` }] }))
    expect(out).toContain(`href="#page-${path}"`)
    expect(out).toContain(`id="page-${path}"`)
  })
})

describe('dashboard', () => {
  it('renders an empty state', () => {
    expect(dashboard([])).toContain('No stored reports')
  })

  it('renders a single run without deltas and charts', () => {
    const out = dashboard([{ key: 'a', report: current }])
    expect(out).toContain('rank<span class="acid">lint</span>')
    expect(out).toContain('<h1>example.com</h1>')
    expect(out).toContain('30 pages')
    expect(out).not.toContain('<svg')
    expect(out).not.toContain('class="dl ')
    expect(out).toContain('href="runs/a.html"')
    expect(out).not.toContain('Run audit')
    expect(out).toContain('RANKLINT_CRUX_API_KEY')
    expect(externalScripts(out)).toEqual([])
    expect(out).toContain('id="issues"')
    expect(out).toContain('data-mode="rule"')
  })

  it('renders a run audit button when runUrl is set', () => {
    const out = dashboard([{ key: 'a', report: current }], { runUrl: 'https://ci.example/new?a=1&b=2' })
    expect(out).toContain('<a class="run-btn" href="https://ci.example/new?a=1&amp;b=2" target="_blank" rel="noopener">Run audit')
  })

  it('renders the cockpit for several runs', () => {
    const out = dashboard(
      [{ key: 'new', report: current }, { key: 'old', report: previous }],
      { runHref: key => `archive/${key}/` },
    )
    expect(out).toContain('10:30 UTC')
    expect(out).toContain('New since 1 Jul, 09:15 UTC')
    expect(out).toContain('Fixed since 1 Jul, 09:15 UTC')
    expect(out).toMatch(/class="read big err"><span class="lbl">Errors<\/span><span class="val">9<\/span><span class="dl bad">\+4 <em>was 5<\/em>/)
    expect(out).toContain('href="#rule-meta:title-length"')
    expect(out).toContain('title="No longer present in the last run"')
    expect(out).toContain('href="#issues"')
    expect(out).toContain('href="#runs"')
    expect(out.indexOf('href="archive/new/"')).toBeLessThan(out.indexOf('href="archive/old/"'))
    expect(out.match(/<svg/g)?.length).toBe(1)
    expect(out).toContain('Top rules')
    expect(out).toContain('Fix once')
  })

  it('skips the diff when the previous run has another format version', () => {
    const old = { ...previous, formatVersion: 0 } as unknown as Report
    const out = dashboard([{ key: 'new', report: current }, { key: 'old', report: old }])
    expect(out).not.toContain('New since')
    expect(out).toContain('href="runs/old.html"')
  })

  it('puts error rules first in the new and top rules panels', () => {
    const out = dashboard([{ key: 'old', report: previous }, { key: 'new', report: current }])
    const newPanel = out.split('id="new-h"')[1]!.split('</section>')[0]!
    const ids = [...newPanel.matchAll(/<code>([^<]+)<\/code>/g)].map(m => m[1])
    expect(ids).toEqual(['meta:title-length', 'links:no-orphans'])
    const top = out.split('Top rules')[1]!.split('</table>')[0]!
    const topIds = [...top.matchAll(/href="#rule-([^"]+)"/g)].map(m => m[1])
    expect(topIds.slice(0, 2)).toEqual(['meta:title-length', 'headings:single-h1'])
  })

  it('charts lighthouse and crux when present', () => {
    const out = dashboard([
      { key: 'a', report: report('2026-07-01T00:00:00.000Z', [], { lighthouse, crux: { lcp: 3000, inp: 150, cls: 0.05 } }) },
      { key: 'b', report: report('2026-07-02T00:00:00.000Z', [], { lighthouse, crux: { lcp: 2000, inp: 150, cls: 0.3 } }) },
    ])
    expect(out.match(/<svg/g)?.length).toBe(3)
    expect(out).not.toContain('RANKLINT_CRUX_API_KEY')
    expect(out).toContain('Lighthouse by page')
    expect(out).toContain('href="#page-/&lt;a&gt;"')
  })

  it('escapes messages and embedded data', () => {
    const out = dashboard([
      { key: 'a', report: report('2026-07-01T00:00:00.000Z', []) },
      { key: 'b', report: report('2026-07-02T00:00:00.000Z', [issue('headings:single-h1', 'error', '/x', 'bad <h1> & co</script>')]) },
    ])
    expect(out).toContain('bad &lt;h1&gt; &amp; co')
    expect(out).not.toContain('bad <h1>')
    expect(out).not.toContain('co</script>')
  })
})

describe('brand', () => {
  it('shows the client logo and a powered-by footer', () => {
    const brand = { logo: 'https://cdn.example.com/logo.svg?a=1&b="2"', name: 'Acme <Shop>' }
    for (const out of [dashboard([{ key: 'a', report: current }], { brand }), html(current, { brand })]) {
      expect(out).toContain('<img class="brand-logo" src="https://cdn.example.com/logo.svg?a=1&amp;b=&quot;2&quot;" alt="Acme &lt;Shop&gt;"')
      expect(out).toContain('Acme &lt;Shop&gt;')
      expect(out).toMatch(/powered by <a class="wm" href="https:\/\/ranklint\.dev" target="_blank" rel="noopener">rank<span class="acid">lint/)
    }
  })

  it('puts powered-by next to the service line', () => {
    const brand = { logo: 'https://cdn.example.com/logo.svg' }
    const board = markup(dashboard([{ key: 'a', report: current }], { brand }))
    expect(board).toMatch(/<footer><div class="pw">powered by [\s\S]*?<\/div>1 run stored · report format v1<\/footer>/)
    const run = markup(html(current, { brand }))
    expect(run).toMatch(/<header class="rbar">[\s\S]*<div class="meta-r"><span class="src">[^<]*<\/span><div class="pw">powered by [\s\S]*<\/header>/)
  })

  it('drives every accent from one css variable with a contrasting ink', () => {
    const dark = dashboard([{ key: 'a', report: current }], { brand: { accent: '#1E6BFF' } })
    expect(dark).toContain(':root{--accent:#1e6bff;--accent-ink:#ffffff}')
    const light = html(current, { brand: { accent: '#fc0' } })
    expect(light).toContain(':root{--accent:#fc0;--accent-ink:#0a0b0d}')
    expect(markup(dark)).not.toContain('#b4f13c')
    expect(dark).toContain('.pw .acid{color:#b4f13c}')
    expect(dark).toContain('.chip.error[aria-pressed=true]{background:var(--err-bg)')
  })

  it('rejects accents that are not hex colors', () => {
    expect(() => dashboard([{ key: 'a', report: current }], { brand: { accent: 'red;}body{display:none' } })).toThrow('Invalid accent color')
    expect(() => html(current, { brand: { accent: '#12345' } })).toThrow('use #rgb or #rrggbb')
  })

  it('falls back to a generic alt and keeps the wordmark without a logo', () => {
    expect(html(current, { brand: { logo: 'data:image/png;base64,AAAA' } })).toContain('alt="logo"')
    const plain = dashboard([{ key: 'a', report: current }], { brand: { name: 'Acme' } })
    expect(plain).not.toContain('powered by')
    expect(markup(plain)).not.toContain('brand-logo')
    expect(plain).toContain('rank<span class="acid">lint</span>')
  })
})

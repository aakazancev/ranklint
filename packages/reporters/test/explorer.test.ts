import { describe, expect, it } from 'vitest'
import { explorerData, explorerSection } from '../src/explorer'
import { altIssues, current, h1Issues, issue, previous, report } from './site'

describe('explorerData', () => {
  it('detects site-wide and section templates by thresholds', () => {
    const data = explorerData(current)
    const scopes = data.T.map(t => ({ rule: data.R[t.r]!.id, scope: t.scope, hit: t.hit, base: t.base }))
    expect(scopes).toContainEqual({ rule: 'images:alt-required', scope: 'site', hit: 12, base: 30 })
    expect(scopes).toContainEqual({ rule: 'meta:title-length', scope: 'blog', hit: 5, base: 6 })
    expect(scopes.map(s => s.rule)).not.toContain('headings:single-h1')
    expect(scopes.map(s => s.rule)).not.toContain('links:no-orphans')
    expect(data.T).toHaveLength(2)
  })

  it('needs 40% of the site, not 11 pages', () => {
    const paths = ['/', '/blog/1', '/blog/2', '/blog/3', ...[1, 2, 3, 4, 5, 6, 7].map(i => `/docs/${i}`)]
    const data = explorerData(report('t', paths.map(p => issue('images:alt-required', 'warn', p, 'Image has no alt'))))
    expect(data.T).toHaveLength(0)
  })

  it('splits element-level templates by selector', () => {
    const issues = [
      ...altIssues,
      ...altIssues.map(i => ({ ...i, selector: 'img.hero' })),
    ]
    const data = explorerData(report('t', issues))
    expect(data.T).toHaveLength(2)
    expect(data.T.map(t => t.sel).sort()).toEqual(['img.hero', 'img.logo'])
  })

  it('marks new issues only against a previous report', () => {
    const isNew = (data: ReturnType<typeof explorerData>) => data.I.filter(i => i[5] === 1).map(i => data.R[i[0]]!.id)
    expect(isNew(explorerData(current))).toEqual([])
    const fresh = isNew(explorerData(current, previous))
    expect(fresh.filter(id => id === 'meta:title-length')).toHaveLength(5)
    expect(fresh).not.toContain('images:alt-required')
    expect(fresh).not.toContain('headings:single-h1')
  })

  it('uses generated rule titles and leaves unknown rules blank', () => {
    const data = explorerData(report('t', [...h1Issues, issue('custom:thing', 'warn', '/')]))
    expect(data.R.find(r => r.id === 'headings:single-h1')!.desc).toBe('exactly one h1')
    expect(data.R.find(r => r.id === 'custom:thing')!.desc).toBe('')
  })

  it('shortens data URIs in selectors', () => {
    const data = explorerData(report('t', [issue('images:alt-required', 'warn', '/', 'x', { selector: 'img[src="data:image/png;base64,AAAABBBBCCCC"]' })]))
    expect(data.I[0]![3]).toBe('img[src="data:image/png…"]')
  })
})

describe('explorerSection', () => {
  it('lists sections with page and issue counts and detected locales', () => {
    const out = explorerSection(explorerData(current, previous), { mode: 'rule', title: 'Issues' })
    expect(out).toContain('<option value="blog">blog — 6 pages · 5 issues</option>')
    expect(out).toContain('<option value="docs">docs — 10 pages · 19 issues</option>')
    expect(out).toContain('<option value="abc">abc — 2 pages · 0 issues</option>')
    expect(out).toContain('<option value="de">de')
    expect(out).toContain('<option value="pt-br">pt-br')
    expect(out).not.toContain('<option value="abc">abc ·')
    expect(out).toContain('id="ex-new"')
  })

  it('hides the only-new toggle without a previous run', () => {
    expect(explorerSection(explorerData(current), { mode: 'rule', title: 'Issues' })).not.toContain('id="ex-new"')
  })

  it('renders the rule view with errors first and a fix-once block', () => {
    const out = explorerSection(explorerData(current, previous), { mode: 'rule', title: 'Issues' })
    expect(out).toContain('data-mode="rule"')
    expect(out).toContain('Fix once')
    const order = [...out.matchAll(/<details class="grp" id="rule-([^"]+)"/g)].map(m => m[1])
    expect(order).toEqual(['meta:title-length', 'headings:single-h1', 'images:alt-required', 'links:no-orphans'])
    expect(out).toContain('shared')
    expect(out).toContain('class="new"')
  })

  it('renders the page view as checklists', () => {
    const out = explorerSection(explorerData(current, previous), { mode: 'page', title: 'Issues' })
    expect(out).toContain('id="page-/blog/1"')
    expect(out).toContain('How to fix')
    expect(out).toContain('fix meta:title-length')
    expect(out).toContain('href="https://ranklint.dev/rules/meta:title-length"')
  })

  it('omits fix-once when nothing repeats', () => {
    const out = explorerSection(explorerData(report('t', h1Issues)), { mode: 'rule', title: 'Issues' })
    expect(out).not.toContain('Fix once')
  })
})

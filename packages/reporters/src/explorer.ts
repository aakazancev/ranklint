import { diffReports, type Issue, type Report, type Severity } from '@ranklint/core'
import { EXPLORER_CLIENT } from './explorer-client'
import { groupByRule } from './markdown'
import { RULE_TITLES } from './rule-titles'
import { esc } from './vitals'

export interface ExRule {
  id: string
  sev: Severity
  desc: string
  fix: number
  docs: string
}

export interface ExTemplate {
  r: number
  scope: string
  hit: number
  base: number
  m: number
  sel: string
  el: number
  n: number
}

export type ExItem = [rule: number, url: number, message: number, selector: string, suggestion: number, isNew: 0 | 1, template: number]

export interface ExplorerData {
  R: ExRule[]
  U: string[]
  M: string[]
  S: string[]
  I: ExItem[]
  T: ExTemplate[]
  prev: boolean
}

export interface ExplorerSectionOptions {
  mode: 'rule' | 'page'
  title: string
  reportHref?: string
}

interface ExplorerRuntime {
  where: (path: string) => { loc: string, sec: string }
  renderStatic: (data: unknown, state: unknown) => string
  templates: (data: unknown, state: unknown) => string
  prepare: (data: unknown) => unknown
}

const SITE_SHARE = 0.4
const SECTION_SHARE = 0.8
const MIN_PAGES = 5

let runtime: ExplorerRuntime | undefined

function client(): ExplorerRuntime {
  if (!runtime) {
    const scope: { RL?: ExplorerRuntime } = {}
    new Function('G', EXPLORER_CLIENT)(scope)
    runtime = scope.RL!
  }
  return runtime
}

export function shortSelector(selector: string): string {
  return selector.replace(/data:([^;,"')]+)[^"')]*/g, 'data:$1…')
}

function pathOf(url: string, origin: string): string {
  try {
    return new URL(url, origin).pathname
  }
  catch {
    return url
  }
}

function indexer(): [string[], (value: string) => number] {
  const list: string[] = []
  const map = new Map<string, number>()
  return [list, (value) => {
    let index = map.get(value)
    if (index === undefined) {
      index = list.length
      map.set(value, index)
      list.push(value)
    }
    return index
  }]
}

function originOf(url: string): string {
  try {
    return new URL(url).origin
  }
  catch {
    return ''
  }
}

export function explorerData(report: Report, previous?: Report): ExplorerData {
  const { where } = client()
  const origin = originOf(report.meta.url)
  const [U, u] = indexer()
  const [M, m] = indexer()
  const [S, s] = indexer()
  for (const page of report.pages ?? []) u(origin + page)
  for (const issue of report.issues) u(issue.url)
  const fresh = new Set<Issue>(previous ? diffReports(previous, report).newIssues : [])

  const R: ExRule[] = []
  const ruleIndex = new Map<string, number>()
  const pageLevel = new Map<string, boolean>()
  for (const group of groupByRule(report.issues)) {
    const freq = new Map<string, number>()
    const seen = new Map<string, number>()
    for (const issue of group.issues) {
      const key = issue.suggestion ?? ''
      freq.set(key, (freq.get(key) ?? 0) + 1)
      const at = `${issue.url}|${issue.message}`
      seen.set(at, (seen.get(at) ?? 0) + 1)
    }
    const main = [...freq].sort((a, b) => b[1] - a[1])[0]![0]
    ruleIndex.set(group.checkId, R.length)
    pageLevel.set(group.checkId, Math.max(...seen.values()) === 1)
    R.push({
      id: group.checkId,
      sev: group.severity,
      desc: RULE_TITLES[group.checkId] ?? '',
      fix: s(main),
      docs: group.issues.find(issue => issue.docs)?.docs ?? '',
    })
  }

  const paths = U.map(url => pathOf(url, origin))
  const pageCount = report.pages?.length ?? report.meta.pagesAudited
  const sectionPages = new Map<string, number>()
  for (const path of new Set(paths)) {
    const { sec } = where(path)
    sectionPages.set(sec, (sectionPages.get(sec) ?? 0) + 1)
  }

  const signature = (issue: Issue) => pageLevel.get(issue.checkId)
    ? `${issue.checkId}\u0000${issue.message}`
    : `${issue.checkId}\u0000${issue.message}\u0000${shortSelector(issue.selector ?? '')}`
  const sigPages = new Map<string, Set<string>>()
  for (const issue of report.issues) {
    const key = signature(issue)
    const set = sigPages.get(key) ?? new Set<string>()
    set.add(pathOf(issue.url, origin))
    sigPages.set(key, set)
  }

  const T: ExTemplate[] = []
  const templateOf = new Map<string, number>()
  const selectors: string[][] = []
  const byGroup = new Map<string, number>()
  for (const [key, set] of sigPages) {
    if (set.size < MIN_PAGES) continue
    let scope: string | undefined
    let base = 0
    let hit = 0
    if (set.size >= SITE_SHARE * pageCount) {
      scope = 'site'
      base = pageCount
      hit = set.size
    }
    else {
      const bySection = new Map<string, number>()
      for (const path of set) {
        const { sec } = where(path)
        bySection.set(sec, (bySection.get(sec) ?? 0) + 1)
      }
      const best = [...bySection]
        .filter(([sec, count]) => (sectionPages.get(sec) ?? 0) >= MIN_PAGES && count >= SECTION_SHARE * sectionPages.get(sec)!)
        .sort((a, b) => b[1] - a[1])[0]
      if (best) {
        scope = best[0]
        base = sectionPages.get(best[0])!
        hit = best[1]
      }
    }
    if (!scope) continue
    const [checkId, message, selector] = key.split('\u0000') as [string, string, string | undefined]
    const groupKey = `${checkId}\u0000${message}\u0000${selector ?? ''}\u0000${scope}`
    let index = byGroup.get(groupKey)
    if (index === undefined) {
      index = T.length
      byGroup.set(groupKey, index)
      T.push({ r: ruleIndex.get(checkId)!, scope, hit, base, m: m(message), sel: '', el: 0, n: 0 })
      selectors.push([])
    }
    T[index]!.hit = Math.max(T[index]!.hit, hit)
    if (selector) selectors[index]!.push(selector)
    templateOf.set(key, index)
  }
  T.forEach((template, index) => {
    const list = selectors[index]!
    template.sel = list.length === 1 ? list[0]! : ''
    template.el = list.length
  })

  const I: ExItem[] = report.issues.map((issue) => {
    const r = ruleIndex.get(issue.checkId)!
    const suggestion = s(issue.suggestion ?? '')
    const t = templateOf.get(signature(issue)) ?? -1
    if (t >= 0) T[t]!.n++
    return [r, u(issue.url), m(issue.message), shortSelector(issue.selector ?? ''), suggestion === R[r]!.fix ? -1 : suggestion, fresh.has(issue) ? 1 : 0, t]
  })

  return { R, U, M, S, I, T, prev: Boolean(previous) }
}

function fmt(value: number): string {
  return value.toLocaleString('en-US')
}

function initialState(mode: 'rule' | 'page') {
  return { mode, sev: { error: true, warn: true, info: true }, q: '', sec: 'all', loc: 'all', onlyNew: false }
}

function facets(data: ExplorerData) {
  const { where } = client()
  const paths = new Map<number, { loc: string, sec: string }>()
  data.U.forEach((url, index) => paths.set(index, where(pathOf(url, 'http://localhost'))))
  const sec = new Map<string, { pages: number, issues: number }>()
  const loc = new Map<string, number>()
  for (const { loc: l, sec: s } of paths.values()) {
    const entry = sec.get(s) ?? { pages: 0, issues: 0 }
    entry.pages++
    sec.set(s, entry)
    loc.set(l, (loc.get(l) ?? 0) + 1)
  }
  for (const item of data.I) sec.get(paths.get(item[1])!.sec)!.issues++
  return {
    sec: [...sec].sort((a, b) => b[1].issues - a[1].issues || b[1].pages - a[1].pages || a[0].localeCompare(b[0])),
    loc: [...loc].sort((a, b) => b[1] - a[1]),
  }
}

function plural(value: number, one: string, many: string): string {
  return `${fmt(value)} ${value === 1 ? one : many}`
}

export function explorerSection(data: ExplorerData, opts: ExplorerSectionOptions): string {
  const rl = client()
  const prepared = rl.prepare(JSON.parse(JSON.stringify(data)))
  const state = initialState(opts.mode)
  const { sec, loc } = facets(data)
  const pages = new Set(data.I.map(item => item[1])).size
  const bySeverity = (severity: Severity) => data.I.filter(item => data.R[item[0]]!.sev === severity).length
  const fresh = data.I.filter(item => item[5] === 1).length
  const locales = loc.length > 1
    ? `<label class="sel-f"><span>Locale</span><select id="ex-loc"><option value="all">All</option>${loc.map(([key, count]) => `<option value="${esc(key)}">${key === 'none' ? 'no prefix' : esc(key)} · ${plural(count, 'page', 'pages')}</option>`).join('')}</select></label>`
    : ''
  const onlyNew = data.prev
    ? `<label class="tgl"><input id="ex-new" type="checkbox"> Only new <span>${fmt(fresh)}</span></label>`
    : ''
  const note = opts.mode === 'rule'
    ? 'Showing the first 20 issues per rule. Filters and grouping by page need JavaScript'
    : 'Showing up to 5 elements per item. Filters and grouping by rule need JavaScript'
  const link = opts.reportHref ? `; the full list is in the <a href="${esc(opts.reportHref)}">run report</a>` : ''
  return `<section class="panel span-12 ex" id="issues" data-mode="${opts.mode}" aria-labelledby="ex-h">
<div class="ex-top"><h2 id="ex-h">${esc(opts.title)}<small class="ex-total">${plural(data.I.length, 'issue', 'issues')} · ${plural(data.R.length, 'rule', 'rules')} · ${plural(pages, 'page', 'pages')}</small></h2>
<div class="ex-bar">
<div class="seg" role="group" aria-label="Group by"><button type="button" data-mode="page" aria-pressed="${opts.mode === 'page'}">By page</button><button type="button" data-mode="rule" aria-pressed="${opts.mode === 'rule'}">By rule</button></div>
<div class="chips" role="group" aria-label="Severity">${(['error', 'warn', 'info'] as const).map(severity => `<button type="button" class="chip ${severity}" data-sev="${severity}" aria-pressed="true">${severity}<span class="n">${fmt(bySeverity(severity))}</span></button>`).join('')}</div>
<label class="srch"><span class="vh">Search</span><input id="ex-q" type="search" placeholder="Search URL, rule or message" autocomplete="off"></label>
<label class="sel-f"><span>Section</span><select id="ex-sec"><option value="all">All sections</option>${sec.map(([key, value]) => `<option value="${esc(key)}">${esc(key)} — ${plural(value.pages, 'page', 'pages')} · ${plural(value.issues, 'issue', 'issues')}</option>`).join('')}</select></label>
${locales}${onlyNew}
</div></div>
<div class="tbox">${rl.templates(prepared, state)}</div>
<div class="glist">${rl.renderStatic(prepared, state)}</div>
<p class="nojs-note">${note}${link}.</p>
</section>`
}

export function explorerScripts(data: ExplorerData): string {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return `<script type="application/json" id="issues-data">${json}</script>
<script>(function (G) {${EXPLORER_CLIENT}})(window)</script>`
}

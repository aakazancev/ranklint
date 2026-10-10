import { diffReports, type Issue, type Report, type Severity } from '@ranklint/core'
import { type Brand, brandMark, clock, day, host, lighthouseRows, lineChart, n, page, poweredBy, signed, since } from './cockpit'
import { explorerData, explorerScripts, explorerSection } from './explorer'
import { groupByRule } from './markdown'
import { averageScore, CRUX_METRICS, type CruxMetric, esc, formatMetric, RATING_LABEL, rateCrux, SCORE_LABEL, type ScoreKey } from './vitals'

export interface DashboardEntry {
  key: string
  report: Report
}

export interface DashboardOptions {
  runHref?: (key: string) => string
  runUrl?: string
  brand?: Brand
}

interface RunStats {
  key: string
  timestamp: string
  pages: number
  error: number
  warn: number
  info: number
  scores: Record<ScoreKey, number | undefined>
  crux: Record<CruxMetric, number | undefined>
}

interface RuleCount {
  checkId: string
  severity: Severity
  count: number
}

const SCORE_KEYS: ScoreKey[] = ['performance', 'seo', 'accessibility', 'bestPractices']
const SCORE_CLASSES = ['acid', 'c2', 'c3', 'c4']
const RANK: Record<Severity, number> = { error: 0, warn: 1, info: 2 }
const NEW_SHOWN = 7
const FIXED_SHOWN = 9
const TOP_ERRORS = 8
const TOP_OTHERS = 6

function stats(entry: DashboardEntry): RunStats {
  const { report } = entry
  const counts = { error: 0, warn: 0, info: 0 }
  for (const issue of report.issues) counts[issue.severity]++
  return {
    key: entry.key,
    timestamp: report.meta.timestamp,
    pages: report.meta.pagesAudited,
    ...counts,
    scores: Object.fromEntries(SCORE_KEYS.map(key => [key, averageScore(report, key)])) as RunStats['scores'],
    crux: Object.fromEntries(CRUX_METRICS.map(key => [key, report.crux?.[key]])) as RunStats['crux'],
  }
}

function tape(current: number, previous: number | undefined, cls: string): string {
  const max = Math.max(current, previous ?? 0, 1) * 1.12
  const tick = previous === undefined ? '' : `<b style="left:${((previous / max) * 100).toFixed(1)}%"></b>`
  return `<span class="tape${cls ? ` ${cls}` : ''}" aria-hidden="true"><i style="width:${((current / max) * 100).toFixed(1)}%"></i>${tick}</span>`
}

function read(label: string, current: number, previous: number | undefined, opts: { cls?: string, good?: 'down' | 'up' | 'none', big?: boolean } = {}): string {
  const { cls = '', good = 'down', big = false } = opts
  let delta = ''
  if (previous !== undefined) {
    const diff = current - previous
    const tone = diff === 0 || good === 'none' ? 'flat' : (diff > 0) === (good === 'up') ? 'good' : 'bad'
    delta = `<span class="dl ${tone}">${signed(diff)} <em>was ${n(previous)}</em></span>`
  }
  return `<div class="read${big ? ' big' : ''}${cls ? ` ${cls}` : ''}"><span class="lbl">${label}</span><span class="val">${n(current)}</span>${delta}${tape(current, previous, cls)}</div>`
}

function countRules(issues: Issue[]): RuleCount[] {
  const map = new Map<string, RuleCount>()
  for (const issue of issues) {
    const key = `${issue.severity}|${issue.checkId}`
    const entry = map.get(key) ?? { checkId: issue.checkId, severity: issue.severity, count: 0 }
    entry.count++
    map.set(key, entry)
  }
  return [...map.values()].sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count || a.checkId.localeCompare(b.checkId))
}

function ruleItems(rules: RuleCount[], present: Set<string>): string {
  return rules.map((rule) => {
    const inner = `<span class="sev">${rule.severity}</span><code>${esc(rule.checkId)}</code><span class="ct">${n(rule.count)}</span>`
    const link = present.has(rule.checkId)
      ? `<a class="go" href="#rule-${esc(rule.checkId)}">${inner}</a>`
      : `<span class="go gone" title="No longer present in the last run">${inner}</span>`
    return `<li class="${rule.severity}">${link}</li>`
  }).join('')
}

function deltaHead(issues: Issue[]): string {
  const counts = { error: 0, warn: 0, info: 0 }
  for (const issue of issues) counts[issue.severity]++
  const parts = [`<span class="e"><strong>${n(counts.error)}</strong>errors</span>`]
  if (counts.warn) parts.push(`<span class="w"><strong>${n(counts.warn)}</strong>warnings</span>`)
  if (counts.info) parts.push(`<span class="i"><strong>${n(counts.info)}</strong>info</span>`)
  return `<div class="delta-head">${parts.join('')}</div>`
}

function ruleList(rules: RuleCount[], shown: number, present: Set<string>): string {
  const head = `<ul class="rules">${ruleItems(rules.slice(0, shown), present)}</ul>`
  const rest = rules.slice(shown)
  if (rest.length === 0) return head
  return `${head}<details><summary>${rest.length} more ${rest.length === 1 ? 'rule' : 'rules'}</summary><ul class="rules">${ruleItems(rest, present)}</ul></details>`
}

function changes(current: Report, previous: Report | undefined, present: Set<string>): string {
  if (!previous) {
    return '<section class="panel span-12"><h2>New and fixed</h2><p class="muted">New and fixed issues appear after the second run.</p></section>'
  }
  const diff = diffReports(previous, current)
  const label = since(previous.meta.timestamp, current.meta.timestamp)
  const fresh = countRules(diff.newIssues)
  const fixed = countRules(diff.fixedIssues)
  const body = (issues: Issue[], rules: RuleCount[], shown: number, empty: string) => issues.length === 0
    ? `<p class="muted">${empty}</p>`
    : `${deltaHead(issues)}${ruleList(rules, shown, present)}`
  return `<section class="panel span-7" aria-labelledby="new-h"><h2 id="new-h">New since ${label}<small>${n(diff.newIssues.length)} issues</small></h2>
${body(diff.newIssues, fresh, NEW_SHOWN, 'No new issues.')}
</section>
<section class="panel span-5 fixed" aria-labelledby="fix-h"><h2 id="fix-h">Fixed since ${label}<small>${n(diff.fixedIssues.length)} issues</small></h2>
${body(diff.fixedIssues, fixed, FIXED_SHOWN, 'Nothing fixed.')}
</section>`
}

function chartLabels(runs: RunStats[]): string[] {
  const days = new Set(runs.map(run => day(run.timestamp)))
  return runs.map(run => (days.size > 1 ? day(run.timestamp).split(' ').slice(0, 2).join(' ') : clock(run.timestamp)))
}

function vitals(values: Record<CruxMetric, number | undefined>): string {
  return `<div class="vit">${CRUX_METRICS.flatMap((metric) => {
    const value = values[metric]
    if (value === undefined) return []
    const rating = rateCrux(metric, value)
    return [`<div class="${rating}"><span>${metric.toUpperCase()}</span><b>${formatMetric(metric, value)}</b><em>${RATING_LABEL[rating]}</em></div>`]
  }).join('')}</div>`
}

function charts(runs: RunStats[]): string {
  const labels = chartLabels(runs)
  const latest = runs[runs.length - 1]!
  const enough = runs.length > 1
  const waiting = '<p class="muted">Charts appear after the second run.</p>'
  const issues = enough
    ? lineChart([
        { name: 'warnings', values: runs.map(run => run.warn), cls: 'warn' },
        { name: 'errors', values: runs.map(run => run.error), cls: 'err' },
      ], labels)
    : waiting
  const hasScores = runs.some(run => run.scores.performance !== undefined)
  const lighthouse = !hasScores
    ? '<div class="empty"><p>No Lighthouse data in these runs. Enable <code>lighthouse</code> in ranklint.config to chart lab scores here.</p></div>'
    : enough
      ? lineChart(SCORE_KEYS.map((key, i) => ({ name: SCORE_LABEL[key], values: runs.map(run => run.scores[key]), cls: SCORE_CLASSES[i]! })), labels, { max: 100 })
      : `<div class="vit">${SCORE_KEYS.filter(key => latest.scores[key] !== undefined).map(key => `<div><span>${SCORE_LABEL[key]}</span><b>${latest.scores[key]}</b></div>`).join('')}</div>`
  const hasCrux = runs.some(run => CRUX_METRICS.some(metric => run.crux[metric] !== undefined))
  const crux = !hasCrux
    ? '<div class="empty"><div class="m"><span>LCP<small>—</small></span><span>INP<small>—</small></span><span>CLS<small>—</small></span></div><p>No CrUX data in these runs. Set <code>RANKLINT_CRUX_API_KEY</code> in the monitor job to chart real-user LCP, INP and CLS here.</p></div>'
    : `${vitals(latest.crux)}${enough
      ? lineChart([
          { name: 'LCP', values: runs.map(run => run.crux.lcp), cls: 'acid' },
          { name: 'INP', values: runs.map(run => run.crux.inp), cls: 'c3' },
        ], labels, { format: value => `${Math.round(value)}` })
      : ''}`
  return `<section class="panel span-4"><h2>Errors and warnings<small>${runs.length} ${runs.length === 1 ? 'run' : 'runs'}</small></h2>${issues}</section>
<section class="panel span-4"><h2>Lighthouse<small>average score</small></h2>${lighthouse}</section>
<section class="panel span-4"><h2>Field data · CrUX<small>p75${hasCrux ? ', ms' : ''}</small></h2>${crux}</section>`
}

function topRules(current: Report, previous: Report | undefined, wide: boolean): string {
  const span = wide ? 'span-12' : 'span-7'
  const groups = groupByRule(current.issues)
  if (groups.length === 0) return `<section class="panel ${span}"><h2>Top rules</h2><p class="muted">No issues found.</p></section>`
  const before = new Map((previous ? groupByRule(previous.issues) : []).map(group => [group.checkId, group.issues.length]))
  const rows = [...groups.filter(g => g.severity === 'error').slice(0, TOP_ERRORS), ...groups.filter(g => g.severity !== 'error').slice(0, TOP_OTHERS)]
  const peak = (severity: Severity) => Math.max(...groups.filter(g => g.severity === severity).map(g => g.issues.length))
  const prevHead = previous ? '<th class="num hide-m">Prev</th>' : ''
  return `<section class="panel ${span}"><h2>Top rules<small>errors first, bars scaled per severity</small></h2><div class="scroll"><table><thead><tr><th class="hide-m">Severity</th><th>Rule</th><th class="num">Count</th>${prevHead}<th class="hide-m"></th></tr></thead><tbody>${rows.map((group) => {
    const count = group.issues.length
    const prev = previous ? `<td class="num hide-m" style="color:var(--fg-dim)">${n(before.get(group.checkId) ?? 0)}</td>` : ''
    return `<tr><td class="hide-m"><span class="sevb ${group.severity}">${group.severity}</span></td><td class="rule ${group.severity}"><a class="tl" href="#rule-${esc(group.checkId)}">${esc(group.checkId)}</a></td><td class="num">${n(count)}</td>${prev}<td class="${group.severity} hide-m"><span class="bar" style="width:${Math.max(2, (count / peak(group.severity)) * 120).toFixed(0)}px"></span></td></tr>`
  }).join('')}</tbody></table></div></section>`
}

function runsTable(runs: RunStats[], href: (key: string) => string): string {
  const rows = [...runs].reverse().map(run => `<tr><td>${esc(day(run.timestamp))} ${esc(clock(run.timestamp))}</td><td class="num">${n(run.pages)}</td><td class="num e">${n(run.error)}</td><td class="num w">${n(run.warn)}</td><td class="num hide-m">${n(run.info)}</td><td class="num hide-m">${run.scores.performance ?? '—'}</td><td><a href="${esc(href(run.key))}"><span class="hide-m">Open </span>report</a></td></tr>`)
  return `<section class="panel span-12 runs" id="runs"><h2>Runs<small>newest first</small></h2><div class="scroll"><table><thead><tr><th>Started</th><th class="num">Pages</th><th class="num">Errors</th><th class="num">Warnings</th><th class="num hide-m">Info</th><th class="num hide-m">LH perf</th><th>Report</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></section>`
}

export function dashboard(entries: DashboardEntry[], opts: DashboardOptions = {}): string {
  const { brand } = opts
  const runButton = opts.runUrl
    ? `<a class="run-btn" href="${esc(opts.runUrl)}" target="_blank" rel="noopener">Run audit now<kbd>↗</kbd></a>`
    : ''
  const sorted = [...entries].sort((a, b) => a.report.meta.timestamp.localeCompare(b.report.meta.timestamp))
  const latest = sorted[sorted.length - 1]
  if (!latest) {
    return page('ranklint monitor', `<main class="rmain"><div class="rail-head">${brandMark(brand)}</div><div class="panel"><h2>ranklint monitor</h2><p class="muted">No stored reports found.</p>${runButton}</div>${poweredBy(brand)}</main>`, brand)
  }
  const previous = sorted[sorted.length - 2]
  const runs = sorted.map(stats)
  const current = runs[runs.length - 1]!
  const before = previous ? runs[runs.length - 2] : undefined
  const href = opts.runHref ?? (key => `runs/${key}.html`)
  const { meta } = latest.report
  const site = host(meta.url)
  const present = new Set(latest.report.issues.map(issue => issue.checkId))
  const data = latest.report.issues.length ? explorerData(latest.report, previous?.report) : undefined
  const explorer = data
    ? explorerSection(data, { mode: 'rule', title: 'Issues in the last run', reportHref: href(latest.key) })
    : '<section class="panel span-12" id="issues"><h2>Issues in the last run</h2><p class="muted">No issues found.</p></section>'
  const perf = current.scores.performance
  const lighthouse = latest.report.lighthouse ?? []
  const rail = `<aside class="rail-out"><div class="rail">
<div class="rail-head">${brandMark(brand)}<span>monitor</span></div>
<div class="site"><h1>${esc(site)}</h1><span>${esc(day(meta.timestamp))} · ${esc(clock(meta.timestamp))} · ${n(meta.pagesAudited)} pages</span></div>
<nav class="jump" aria-label="Sections"><a href="#overview">Overview</a><a href="#issues">Issues <span>${n(latest.report.issues.length)}</span></a><a href="#runs">Runs</a></nav>
${runButton}
<section class="verdict" aria-label="Last run">
${read('Errors', current.error, before?.error, { cls: 'err', big: true })}
<div class="pair">${read('Warnings', current.warn, before?.warn, { cls: 'warn' })}${read('Info', current.info, before?.info, { cls: 'info' })}${read('Pages audited', current.pages, before?.pages, { good: 'none' })}${perf === undefined ? '' : read('Lighthouse perf', perf, before?.scores.performance, { good: 'up', cls: 'ok' })}</div>
${before ? `<div class="legend-note"><b></b>tick = previous run, ${esc(since(before.timestamp, current.timestamp))}</div>` : ''}
</section>
<footer>${poweredBy(brand)}${runs.length} ${runs.length === 1 ? 'run' : 'runs'} stored · report format v${latest.report.formatVersion}</footer>
</div></aside>`
  const main = `<main id="overview">
${changes(latest.report, previous?.report, present)}
${charts(runs)}
${topRules(latest.report, previous?.report, lighthouse.length === 0)}
${lighthouse.length ? `<section class="panel span-5"><h2>Lighthouse by page<small>performance</small></h2>${lighthouseRows(lighthouse, false)}</section>` : ''}
${explorer}
${runsTable(runs, href)}
</main>`
  return page(`ranklint monitor · ${esc(site)}`, `<div class="shell">
${rail}
${main}
</div>`, brand, data ? explorerScripts(data) : '')
}

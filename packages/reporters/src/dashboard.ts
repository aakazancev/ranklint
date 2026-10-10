import { diffReports, type Issue, type Report } from '@ranklint/core'
import { groupByRule, sortBySeverity } from './markdown'
import { averageScore, CRUX_METRICS, type CruxMetric, esc, formatMetric, SCORE_LABEL, type ScoreKey } from './vitals'

export interface DashboardEntry {
  key: string
  report: Report
}

export interface DashboardOptions {
  runHref?: (key: string) => string
  runUrl?: string
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

interface Series {
  name: string
  values: (number | undefined)[]
}

const SCORE_KEYS: ScoreKey[] = ['performance', 'seo', 'accessibility', 'bestPractices']
const DIFF_LIMIT = 20
const TOP_RULES = 20

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

function shortDate(timestamp: string): string {
  return timestamp.replace('T', ' ').slice(0, 16)
}

function formatNumber(value: number, metric?: CruxMetric): string {
  return metric ? formatMetric(metric, value) : String(Math.round(value))
}

function delta(current: number, previous: number | undefined, direction: 'lower' | 'higher' | 'neutral', metric?: CruxMetric): string {
  if (previous === undefined) return ''
  const diff = metric === 'cls' ? Number((current - previous).toFixed(2)) : Math.round(current - previous)
  if (diff === 0) return ' <span class="delta">±0</span>'
  const better = direction === 'neutral' ? '' : (diff < 0) === (direction === 'lower') ? ' good' : ' bad'
  return ` <span class="delta${better}">${diff > 0 ? '+' : '−'}${Math.abs(diff)}</span>`
}

function tile(label: string, value: string, deltaHtml: string): string {
  return `<div class="tile"><span class="tile-label">${label}</span><b>${value}</b>${deltaHtml}</div>`
}

function tiles(current: RunStats, previous: RunStats | undefined): string {
  const out = [
    tile('errors', String(current.error), delta(current.error, previous?.error, 'lower')),
    tile('warnings', String(current.warn), delta(current.warn, previous?.warn, 'lower')),
    tile('info', String(current.info), delta(current.info, previous?.info, 'lower')),
    tile('pages', String(current.pages), delta(current.pages, previous?.pages, 'neutral')),
  ]
  const performance = current.scores.performance
  if (performance !== undefined) {
    out.push(tile('Lighthouse performance', String(performance), delta(performance, previous?.scores.performance, 'higher')))
  }
  for (const metric of CRUX_METRICS) {
    const value = current.crux[metric]
    if (value === undefined) continue
    out.push(tile(`CrUX ${metric.toUpperCase()}`, formatNumber(value, metric), delta(value, previous?.crux[metric], 'lower', metric)))
  }
  return `<section class="tiles">
${out.join('\n')}
</section>`
}

function issueList(title: string, issues: Issue[], kind: string): string {
  if (issues.length === 0) return ''
  const items = sortBySeverity(issues).slice(0, DIFF_LIMIT).map(issue =>
    `<li><span class="badge ${issue.severity}">${issue.severity}</span> <code>${esc(issue.checkId)}</code> <span class="url">${esc(issue.url)}</span><div class="hint">${esc(issue.message)}</div></li>`)
  if (issues.length > DIFF_LIMIT) items.push(`<li class="more">and ${issues.length - DIFF_LIMIT} more</li>`)
  return `<div class="changes-${kind}">
<h3>${title} (${issues.length})</h3>
<ul>
${items.join('\n')}
</ul>
</div>`
}

function changes(current: Report, previous: Report | undefined): string {
  if (!previous) return ''
  const diff = diffReports(previous, current)
  const body = [issueList('New issues', diff.newIssues, 'new'), issueList('Fixed issues', diff.fixedIssues, 'fixed')].filter(Boolean)
  return `<section class="changes">
<h2>Since the previous run</h2>
${body.length === 0 ? '<p>No changes.</p>' : body.join('\n')}
</section>`
}

function chart(title: string, labels: string[], series: Series[], opts: { max?: number, metric?: CruxMetric } = {}): string {
  const filled = series.filter(s => s.values.some(v => v !== undefined))
  if (filled.length === 0) return ''
  const width = 600
  const height = 200
  const left = 56
  const right = 12
  const top = 12
  const bottom = 32
  const values = filled.flatMap(s => s.values.filter((v): v is number => v !== undefined))
  const peak = opts.max ?? Math.max(...values)
  const max = opts.metric === 'cls' ? peak || 1 : Math.max(2, Math.ceil(peak / 2) * 2)
  const x = (i: number) => left + (labels.length === 1 ? 0 : (i / (labels.length - 1)) * (width - left - right))
  const y = (v: number) => top + (1 - v / max) * (height - top - bottom)
  const grid = [0, max / 2, max].map(v =>
    `<line class="grid" x1="${left}" x2="${width - right}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="axis" x="${left - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(formatNumber(v, opts.metric).replace(' ms', ''))}</text>`)
  const xLabels = [`<text class="axis" x="${left}" y="${height - 6}">${esc(shortDate(labels[0]!))}</text>`]
  if (labels.length > 1) xLabels.push(`<text class="axis" x="${width - right}" y="${height - 6}" text-anchor="end">${esc(shortDate(labels[labels.length - 1]!))}</text>`)
  const lines = filled.map((s, index) => {
    let path = ''
    let pen = 'M'
    const dots: string[] = []
    s.values.forEach((value, i) => {
      if (value === undefined) {
        pen = 'M'
        return
      }
      path += `${pen}${x(i).toFixed(1)},${y(value).toFixed(1)} `
      pen = 'L'
      dots.push(`<circle cx="${x(i).toFixed(1)}" cy="${y(value).toFixed(1)}" r="3"><title>${esc(`${s.name} · ${shortDate(labels[i]!)} · ${formatNumber(value, opts.metric)}`)}</title></circle>`)
    })
    return `<g class="series s${index}"><path d="${path.trim()}"/>${dots.join('')}</g>`
  })
  const legend = filled.length > 1
    ? `<ul class="legend">${filled.map((s, index) => `<li class="s${index}">${esc(s.name)}</li>`).join('')}</ul>`
    : ''
  return `<figure class="chart">
<figcaption>${esc(title)}</figcaption>
<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">${grid.join('')}${xLabels.join('')}${lines.join('')}</svg>
${legend}
</figure>`
}

function charts(runs: RunStats[]): string {
  if (runs.length < 2) return '<p class="hint">Charts appear after the second run.</p>'
  const labels = runs.map(run => run.timestamp)
  const items = [
    chart('Errors and warnings', labels, [
      { name: 'errors', values: runs.map(run => run.error) },
      { name: 'warnings', values: runs.map(run => run.warn) },
    ]),
    chart('Lighthouse scores (average)', labels, SCORE_KEYS.map(key => ({
      name: SCORE_LABEL[key],
      values: runs.map(run => run.scores[key]),
    })), { max: 100 }),
    ...CRUX_METRICS.map(metric => chart(
      `CrUX ${metric.toUpperCase()}, p75${metric === 'cls' ? '' : ', ms'}`,
      labels,
      [{ name: metric.toUpperCase(), values: runs.map(run => run.crux[metric]) }],
      { metric },
    )),
  ].filter(Boolean)
  return items.join('\n')
}

function topRules(report: Report): string {
  const groups = groupByRule(report.issues).slice(0, TOP_RULES)
  if (groups.length === 0) return '<p>No issues found.</p>'
  return `<div class="scroll"><table>
<thead><tr><th>Rule</th><th>Severity</th><th>Count</th></tr></thead>
<tbody>
${groups.map(group => `<tr><td><code>${esc(group.checkId)}</code></td><td><span class="badge ${group.severity}">${group.severity}</span></td><td>${group.issues.length}</td></tr>`).join('\n')}
</tbody>
</table></div>`
}

function runsTable(runs: RunStats[], href: (key: string) => string): string {
  const rows = [...runs].reverse().map((run) => {
    const performance = run.scores.performance
    const lcp = run.crux.lcp
    return `<tr><td>${esc(shortDate(run.timestamp))}</td><td>${run.pages}</td><td>${run.error}</td><td>${run.warn}</td><td>${run.info}</td><td>${performance ?? '—'}</td><td>${lcp === undefined ? '—' : formatMetric('lcp', lcp)}</td><td><a href="${esc(href(run.key))}">report</a></td></tr>`
  })
  return `<div class="scroll"><table>
<thead><tr><th>Date</th><th>Pages</th><th>Errors</th><th>Warnings</th><th>Info</th><th>Perf</th><th>CrUX LCP</th><th></th></tr></thead>
<tbody>
${rows.join('\n')}
</tbody>
</table></div>`
}

const STYLE = `
  :root { color-scheme: light dark; --fg: #1a1a2e; --muted: #666; --bg: #fafafa; --card: #fff; --border: #e5e5ef; --grid: #eee;
    --good: #2f855a; --bad: #c0392b; --c0: #c0392b; --c1: #b7791f; --c2: #2b6cb0; --c3: #2f855a; }
  @media (prefers-color-scheme: dark) {
    :root { --fg: #e6e6f0; --muted: #9a9ab0; --bg: #14141f; --card: #1d1d2b; --border: #2e2e42; --grid: #2a2a3c;
      --good: #68d391; --bad: #fc8181; --c0: #fc8181; --c1: #f6c35b; --c2: #7fb2f0; --c3: #68d391; }
  }
  * { box-sizing: border-box; }
  body { font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 32px; color: var(--fg); background: var(--bg); max-width: 1100px; }
  h1 { font-size: 20px; margin: 0; }
  h2 { font-size: 16px; margin: 32px 0 12px; }
  h3 { font-size: 14px; margin: 16px 0 8px; }
  a { color: var(--c2); }
  .masthead { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .masthead p { margin: 4px 0 0; color: var(--muted); word-break: break-all; }
  .run-audit { display: inline-block; padding: 8px 16px; border-radius: 8px; background: var(--c2); color: var(--card); text-decoration: none; font-weight: 600; }
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; margin: 24px 0; }
  .tile { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; }
  .tile-label { display: block; color: var(--muted); font-size: 12px; }
  .tile b { font-size: 22px; }
  .delta { font-size: 12px; color: var(--muted); }
  .delta.good { color: var(--good); }
  .delta.bad { color: var(--bad); }
  .changes ul { list-style: none; padding: 0; margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; }
  .changes li { padding: 8px 12px; border-top: 1px solid var(--grid); }
  .changes li:first-child { border-top: 0; }
  .charts { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 12px; }
  .chart { margin: 0; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; }
  .chart figcaption { font-weight: 600; margin-bottom: 4px; }
  .chart svg { width: 100%; height: auto; display: block; }
  .grid { stroke: var(--grid); }
  .axis { fill: var(--muted); font-size: 16px; }
  .series path { fill: none; stroke-width: 2; }
  .s0 path { stroke: var(--c0); } .s0 circle { fill: var(--c0); }
  .s1 path { stroke: var(--c1); } .s1 circle { fill: var(--c1); }
  .s2 path { stroke: var(--c2); } .s2 circle { fill: var(--c2); }
  .s3 path { stroke: var(--c3); } .s3 circle { fill: var(--c3); }
  .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 12px; padding: 0; margin: 8px 0 0; font-size: 12px; }
  .legend li::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; }
  .legend .s0::before { background: var(--c0); } .legend .s1::before { background: var(--c1); }
  .legend .s2::before { background: var(--c2); } .legend .s3::before { background: var(--c3); }
  .scroll { overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 8px; }
  th, td { text-align: left; padding: 8px 12px; border-top: 1px solid var(--grid); vertical-align: top; white-space: nowrap; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .badge.error { background: #fde8e8; color: #c0392b; }
  .badge.warn { background: #fef4e5; color: #b7791f; }
  .badge.info { background: #e8f0fe; color: #2b6cb0; }
  .url { word-break: break-all; }
  .hint { color: var(--muted); font-size: 12px; margin-top: 4px; }
  @media (max-width: 600px) {
    body { padding: 16px; }
    .tiles { grid-template-columns: repeat(2, 1fr); }
    .charts { grid-template-columns: 1fr; }
  }
`

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>${STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`
}

export function dashboard(entries: DashboardEntry[], opts: DashboardOptions = {}): string {
  const runButton = opts.runUrl
    ? `<a class="run-audit" href="${esc(opts.runUrl)}" target="_blank" rel="noopener">Run audit</a>`
    : ''
  const sorted = [...entries].sort((a, b) => a.report.meta.timestamp.localeCompare(b.report.meta.timestamp))
  const latest = sorted[sorted.length - 1]
  if (!latest) {
    return page('Ranklint dashboard', `<header class="masthead"><h1>Ranklint dashboard</h1>${runButton}</header>
<p>No stored reports found.</p>`)
  }
  const previous = sorted[sorted.length - 2]
  const runs = sorted.map(stats)
  const href = opts.runHref ?? (key => `runs/${key}.html`)
  const { meta } = latest.report
  return page(`Ranklint dashboard — ${esc(meta.url)}`, `<header class="masthead">
<div><h1>Ranklint dashboard</h1>
<p>${esc(meta.url)} · last run ${esc(meta.timestamp)} · ${meta.pagesAudited} pages</p></div>
${runButton}
</header>
${tiles(runs[runs.length - 1]!, previous ? runs[runs.length - 2] : undefined)}
${changes(latest.report, previous?.report)}
<section class="trends">
<h2>Trends</h2>
<div class="charts">
${charts(runs)}
</div>
</section>
<section class="rules">
<h2>Top rules</h2>
${topRules(latest.report)}
</section>
<section class="runs">
<h2>Runs</h2>
${runsTable(runs, href)}
</section>`)
}

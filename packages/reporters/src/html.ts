import type { Report } from '@ranklint/core'
import { type Brand, brandMark, clock, day, host, lighthouseRows, n, page, poweredBy, signed, since } from './cockpit'
import { explorerData, explorerScripts, explorerSection } from './explorer'
import { averageScore, CRUX_METRICS, esc, formatMetric, RATING_LABEL, rateCrux } from './vitals'

export interface HtmlOptions {
  previous?: Report
  dashboardHref?: string
  brand?: Brand
}

function counts(report: Report) {
  const out = { error: 0, warn: 0, info: 0 }
  for (const issue of report.issues) out[issue.severity]++
  return out
}

function read(label: string, value: number, prevLabel: string | undefined, before: number | undefined, cls: string, good: 'down' | 'up'): string {
  let delta = ''
  if (prevLabel !== undefined && before !== undefined) {
    const diff = value - before
    const tone = diff === 0 ? 'flat' : (diff > 0) === (good === 'up') ? 'good' : 'bad'
    delta = `<span class="dl ${tone}">${signed(diff)} <em>vs ${esc(prevLabel)}</em></span>`
  }
  return `<div class="rr${cls ? ` ${cls}` : ''}"><span class="lbl">${label}</span><span class="val">${n(value)}</span>${delta}</div>`
}

function crux(report: Report): string {
  const values = report.crux
  if (!values) return ''
  const tiles = CRUX_METRICS.flatMap((metric) => {
    const value = values[metric]
    if (value === undefined) return []
    const rating = rateCrux(metric, value)
    return [`<div class="${rating}"><span>${metric.toUpperCase()}</span><b>${formatMetric(metric, value)}</b><em>${RATING_LABEL[rating]}</em></div>`]
  })
  if (tiles.length === 0) return ''
  return `<section class="panel"><h2><span>Field data · CrUX</span><small>p75 of real users, origin</small></h2><div class="vit">${tiles.join('')}</div></section>`
}

export function html(report: Report, opts: HtmlOptions = {}): string {
  const { previous, brand } = opts
  const site = host(report.meta.url)
  const now = counts(report)
  const was = previous ? counts(previous) : undefined
  const perf = averageScore(report, 'performance')
  const withIssues = new Set(report.issues.map(issue => issue.url)).size
  const data = report.issues.length ? explorerData(report, previous) : undefined
  const back = opts.dashboardHref ? `<a class="back" href="${esc(opts.dashboardHref)}">← Dashboard</a>` : ''
  const lighthouse = report.lighthouse ?? []
  const prevLabel = previous ? since(previous.meta.timestamp, report.meta.timestamp) : undefined
  const stamp = `${day(report.meta.timestamp)}, ${clock(report.meta.timestamp)}`
  const body = `<header class="rbar">${brandMark(brand)}${back}<span class="sp"></span><div class="meta-r"><span class="src">${esc(site)} · report format v${report.formatVersion}</span>${poweredBy(brand)}</div></header>
<main class="rmain">
<div class="rhead"><div><h1>${esc(site)} · ${esc(stamp)}</h1><p>${n(report.meta.pagesAudited)} pages audited · <span class="cov"><b>${n(withIssues)}</b> URLs with issues</span>${prevLabel ? ` · previous run ${esc(prevLabel)}` : ''}</p></div>
<div class="reads">${read('Errors', now.error, prevLabel, was?.error, 'err', 'down')}${read('Warnings', now.warn, prevLabel, was?.warn, 'warn', 'down')}${read('Info', now.info, prevLabel, was?.info, 'info', 'down')}${perf === undefined ? '' : read('Lighthouse perf', perf, prevLabel, previous ? averageScore(previous, 'performance') : undefined, '', 'up')}</div></div>
${data ? explorerSection(data, { mode: 'page', title: 'Issues in this run' }) : '<section class="panel" id="issues"><h2>Issues in this run</h2><p class="muted">No issues found.</p></section>'}
${crux(report)}
${lighthouse.length ? `<section class="panel"><h2><span>Lighthouse by page</span><small>lab</small></h2>${lighthouseRows(lighthouse, true)}</section>` : ''}
</main>`
  return page(`ranklint report · ${esc(site)} · ${esc(stamp)}`, body, brand, data ? explorerScripts(data) : '')
}

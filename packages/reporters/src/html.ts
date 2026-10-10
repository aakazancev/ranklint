import type { Report } from '@ranklint/core'
import { groupByRule } from './markdown'
import { CRUX_METRICS, esc, formatMetric, RATING_LABEL, rateCrux, SCORE_LABEL, scoreClass, type ScoreKey } from './vitals'

const SCORE_KEYS: ScoreKey[] = ['performance', 'seo', 'accessibility', 'bestPractices']

function cruxTiles(report: Report): string {
  const crux = report.crux
  if (!crux) return ''
  const tiles = CRUX_METRICS.flatMap((metric) => {
    const value = crux[metric]
    if (value === undefined) return []
    const rating = rateCrux(metric, value)
    return [`<div class="stat vital ${rating}"><span>${metric.toUpperCase()}</span><b>${formatMetric(metric, value)}</b><em>${RATING_LABEL[rating]}</em></div>`]
  })
  if (tiles.length === 0) return ''
  return `<h3>CrUX · p75 of real users</h3>
<div class="summary">
  ${tiles.join('\n  ')}
</div>`
}

function lighthouseTable(report: Report): string {
  const results = report.lighthouse ?? []
  if (results.length === 0) return ''
  const rows = results.map((result) => {
    const scores = SCORE_KEYS.map((key) => {
      const value = result.metrics[key]
      return value === undefined ? '<td>—</td>' : `<td class="score ${scoreClass(value)}">${Math.round(value)}</td>`
    })
    const metrics = (['lcp', 'cls', 'tbt'] as const).map((key) => {
      const value = result.metrics[key]
      return `<td>${value === undefined ? '—' : formatMetric(key, value)}</td>`
    })
    const hint = result.lcpElement?.suggestion ? `<div class="hint">💡 ${esc(result.lcpElement.suggestion)}</div>` : ''
    return `<tr>
    <td class="url">${esc(result.url)}<div class="hint">${esc(result.aggregation)} of ${result.runs} runs</div>${hint}</td>
    ${[...scores, ...metrics].join('')}
  </tr>`
  })
  return `<h3>Lighthouse</h3>
<table>
<thead><tr><th>URL</th>${SCORE_KEYS.map(key => `<th>${SCORE_LABEL[key]}</th>`).join('')}<th>LCP</th><th>CLS</th><th>TBT</th></tr></thead>
<tbody>
${rows.join('\n')}
</tbody>
</table>`
}

function webVitals(report: Report): string {
  const body = [cruxTiles(report), lighthouseTable(report)].filter(Boolean)
  if (body.length === 0) return ''
  return `<section class="vitals">
<h2>Web Vitals</h2>
${body.join('\n')}
</section>
`
}

export function html(report: Report): string {
  const counts = { error: 0, warn: 0, info: 0 }
  for (const issue of report.issues) counts[issue.severity]++

  const sections = groupByRule(report.issues).map(group => `<h2 class="rule"><code>${esc(group.checkId)}</code> <span class="badge ${group.severity}">${group.severity}</span> <small>${group.issues.length}</small></h2>
<table>
<thead><tr><th>URL</th><th>Message</th></tr></thead>
<tbody>
${group.issues.map(issue => `<tr class="${issue.severity}">
    <td class="url">${esc(issue.url)}</td>
    <td>${esc(issue.message)}${issue.suggestion ? `<div class="hint">💡 ${esc(issue.suggestion)}</div>` : ''}</td>
  </tr>`).join('\n')}
</tbody>
</table>`).join('\n')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ranklint report — ${esc(report.meta.url)}</title>
<style>
  body { font: 14px/1.5 system-ui, sans-serif; margin: 0; padding: 32px; color: #1a1a2e; background: #fafafa; }
  h1 { font-size: 20px; }
  .summary { display: flex; gap: 16px; margin: 16px 0 24px; }
  .stat { background: #fff; border: 1px solid #e5e5ef; border-radius: 8px; padding: 12px 20px; }
  .stat b { display: block; font-size: 22px; }
  table { border-collapse: collapse; width: 100%; background: #fff; border: 1px solid #e5e5ef; border-radius: 8px; }
  th, td { text-align: left; padding: 8px 12px; border-top: 1px solid #eee; vertical-align: top; }
  .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
  .badge.error { background: #fde8e8; color: #c0392b; }
  .badge.warn { background: #fef4e5; color: #b7791f; }
  .badge.info { background: #e8f0fe; color: #2b6cb0; }
  .url { word-break: break-all; max-width: 280px; }
  .hint { color: #666; font-size: 12px; margin-top: 4px; }
  h2.rule { font-size: 15px; margin: 24px 0 8px; }
  h2.rule small { color: #666; font-weight: 400; }
  .vitals { margin-bottom: 24px; overflow-x: auto; }
  .vitals h2 { font-size: 16px; }
  .vitals h3 { font-size: 14px; margin: 16px 0 8px; }
  .vital span { color: #666; font-size: 12px; }
  .vital em { display: block; font-style: normal; font-size: 12px; font-weight: 600; }
  .good em, .score.good { color: #2f855a; }
  .needs-improvement em, .score.average { color: #b7791f; }
  .poor em, .score.poor { color: #c0392b; }
  .score { font-weight: 600; }
</style>
</head>
<body>
<h1>Ranklint report</h1>
<p>${esc(report.meta.url)} · ${report.meta.pagesAudited} pages · ${esc(report.meta.timestamp)}</p>
<div class="summary">
  <div class="stat"><b>${counts.error}</b> errors</div>
  <div class="stat"><b>${counts.warn}</b> warnings</div>
  <div class="stat"><b>${counts.info}</b> info</div>
</div>
${webVitals(report)}${report.issues.length === 0 ? '<p>No issues found 🎉</p>' : sections}
</body>
</html>
`
}

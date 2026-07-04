import type { Report, Severity } from '@ranklint/core'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const order: Record<Severity, number> = { error: 0, warn: 1, info: 2 }

export function html(report: Report): string {
  const counts = { error: 0, warn: 0, info: 0 }
  for (const issue of report.issues) counts[issue.severity]++
  const sorted = [...report.issues].sort((a, b) =>
    order[a.severity] - order[b.severity] || a.url.localeCompare(b.url))

  const rows = sorted.map(issue => `<tr class="${issue.severity}">
    <td><span class="badge ${issue.severity}">${issue.severity}</span></td>
    <td><code>${esc(issue.checkId)}</code></td>
    <td class="url">${esc(issue.url)}</td>
    <td>${esc(issue.message)}${issue.suggestion ? `<div class="hint">💡 ${esc(issue.suggestion)}</div>` : ''}</td>
  </tr>`).join('\n')

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
${report.issues.length === 0
  ? '<p>No issues found 🎉</p>'
  : `<table>
<thead><tr><th>Severity</th><th>Check</th><th>URL</th><th>Message</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`}
</body>
</html>
`
}

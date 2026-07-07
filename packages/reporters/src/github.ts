import type { Report, Severity } from '@ranklint/core'

const LEVEL_MAP: Record<Severity, string> = {
  error: 'error',
  warn: 'warning',
  info: 'notice',
}

function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A')
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C')
}

export function github(report: Report): string {
  const lines = report.issues.map((issue) => {
    const location = issue.selector ? `${issue.url} → ${issue.selector}` : issue.url
    const suggestion = issue.suggestion ? ` (${issue.suggestion})` : ''
    return `::${LEVEL_MAP[issue.severity]} title=${escapeProperty(issue.checkId)}::${escapeData(`${location} — ${issue.message}${suggestion}`)}`
  })
  lines.push(`ranklint: ${report.issues.length} issues on ${report.meta.pagesAudited} pages (${report.meta.url})`)
  return `${lines.join('\n')}\n`
}

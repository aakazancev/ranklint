import type { Issue, Report, Severity } from '@ranklint/core'

const order: Record<Severity, number> = { error: 0, warn: 1, info: 2 }

function cell(value: string | undefined): string {
  return (value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

export function markdown(report: Report): string {
  const lines: string[] = []
  lines.push('# Ranklint report')
  lines.push('')
  lines.push(`**Site:** ${report.meta.url} · **Pages audited:** ${report.meta.pagesAudited} · **Timestamp:** ${report.meta.timestamp}`)
  if (report.meta.truncated) {
    lines.push('')
    lines.push('> Crawl was truncated by maxPages — results are partial.')
  }
  lines.push('')

  const counts = { error: 0, warn: 0, info: 0 }
  for (const issue of report.issues) counts[issue.severity]++
  lines.push(`**${counts.error} errors, ${counts.warn} warnings, ${counts.info} info**`)
  lines.push('')

  if (report.issues.length === 0) {
    lines.push('No issues found.')
    lines.push('')
    return lines.join('\n')
  }

  const sorted = [...report.issues].sort((a: Issue, b: Issue) =>
    order[a.severity] - order[b.severity] || a.url.localeCompare(b.url) || a.checkId.localeCompare(b.checkId))

  lines.push('| Severity | Check | URL | Message | Suggestion |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const issue of sorted) {
    lines.push(`| ${issue.severity} | \`${issue.checkId}\` | ${cell(issue.url)} | ${cell(issue.message)} | ${cell(issue.suggestion)} |`)
  }
  lines.push('')
  return lines.join('\n')
}

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

  if (report.lighthouse && report.lighthouse.length > 0) {
    lines.push('### Lighthouse')
    lines.push('')
    lines.push('| URL | Perf | SEO | A11y | BP | LCP | CLS |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')
    for (const r of report.lighthouse) {
      const m = r.metrics
      const cell = (v: number | undefined) => v === undefined ? '—' : String(v)
      lines.push(`| ${r.url} | ${cell(m.performance)} | ${cell(m.seo)} | ${cell(m.accessibility)} | ${cell(m.bestPractices)} | ${cell(m.lcp)} | ${cell(m.cls)} |`)
    }
    lines.push('')
  }

  if (report.crawlBudget) {
    const cb = report.crawlBudget
    lines.push('### Crawl budget')
    lines.push('')
    lines.push(`${cb.parametricUrls} parametric URLs crawled, **${cb.junkUrls} look like junk** (no canonical, no noindex).`)
    lines.push('')
    lines.push('| Pattern | Params | URLs | Canonical | Noindex |')
    lines.push('| --- | --- | --- | --- | --- |')
    for (const group of cb.groups) {
      lines.push(`| ${group.pattern} | ${group.params.join(', ')} | ${group.count} | ${group.withCanonical} | ${group.withNoindex} |`)
    }
    lines.push('')
  }

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

import type { DiffResult, Issue } from '@ranklint/core'

function issueRows(issues: Issue[]): string[] {
  return issues.map(i =>
    `| ${i.severity} | \`${i.checkId}\` | ${i.url.replace(/\|/g, '\\|')} | ${i.message.replace(/\|/g, '\\|')} |`)
}

export function markdownDiff(diff: DiffResult): string {
  const lines: string[] = []
  lines.push('## Ranklint SEO Diff')
  lines.push('')
  const errors = diff.newIssues.filter(i => i.severity === 'error').length
  lines.push(`**${diff.newIssues.length} new issues (${errors} errors) · ${diff.fixedIssues.length} fixed**`)
  lines.push('')

  if (diff.newIssues.length === 0 && diff.fixedIssues.length === 0) {
    lines.push('No SEO changes detected. ✅')
    lines.push('')
  }

  if (diff.newIssues.length > 0) {
    lines.push('### 🔴 New issues')
    lines.push('')
    lines.push('| Severity | Check | URL | Message |')
    lines.push('| --- | --- | --- | --- |')
    lines.push(...issueRows(diff.newIssues))
    lines.push('')
  }

  if (diff.fixedIssues.length > 0) {
    lines.push('### ✅ Fixed')
    lines.push('')
    lines.push('| Severity | Check | URL | Message |')
    lines.push('| --- | --- | --- | --- |')
    lines.push(...issueRows(diff.fixedIssues))
    lines.push('')
  }

  if (diff.lighthouse && diff.lighthouse.length > 0) {
    lines.push('### Lighthouse deltas')
    lines.push('')
    lines.push('| URL | Metric | Base | Current |')
    lines.push('| --- | --- | --- | --- |')
    for (const delta of diff.lighthouse) {
      const worse = delta.metric === 'lcp' || delta.metric === 'cls' || delta.metric === 'tbt'
        ? delta.current > delta.base
        : delta.current < delta.base
      lines.push(`| ${delta.url} | ${delta.metric} | ${delta.base} | ${delta.current} ${worse ? '🔻' : '🟢'} |`)
    }
    lines.push('')
  }

  const { added, removed } = diff.pagesDelta
  if (added.length > 0 || removed.length > 0) {
    lines.push('### Pages')
    lines.push('')
    if (added.length > 0) lines.push(`Added: ${added.map(p => `\`${p}\``).join(', ')}`)
    if (removed.length > 0) lines.push(`Removed: ${removed.map(p => `\`${p}\``).join(', ')}`)
    lines.push('')
  }

  return lines.join('\n')
}

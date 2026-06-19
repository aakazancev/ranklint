import type { Report } from '@ranklint/core'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function junit(report: Report): string {
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  const tests = Math.max(report.issues.length, 1)
  lines.push(`<testsuites name="ranklint" tests="${tests}" failures="${report.issues.length}">`)
  lines.push(`  <testsuite name="ranklint" tests="${tests}" failures="${report.issues.length}">`)
  if (report.issues.length === 0) {
    lines.push(`    <testcase name="no issues" classname="ranklint"/>`)
  }
  for (const issue of report.issues) {
    const name = esc(`${issue.checkId} ${issue.url}`)
    const message = esc(issue.message)
    const body = esc(issue.suggestion ? `${issue.message}\n${issue.suggestion}` : issue.message)
    lines.push(`    <testcase name="${name}" classname="${esc(issue.checkId)}">`)
    lines.push(`      <failure message="${message}">${body}</failure>`)
    lines.push('    </testcase>')
  }
  lines.push('  </testsuite>')
  lines.push('</testsuites>')
  lines.push('')
  return lines.join('\n')
}

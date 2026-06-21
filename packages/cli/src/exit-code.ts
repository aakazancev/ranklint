import type { Report } from '@ranklint/core'

export function exitCodeFor(report: Report): 0 | 1 {
  return report.issues.some(issue => issue.severity === 'error') ? 1 : 0
}

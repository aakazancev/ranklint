import type { Report } from '@ranklint/core'

export interface HistoryRow {
  key: string
  timestamp: string
  pages: number
  errors: number
  warnings: number
  performance?: number
}

export function historyRow(key: string, report: Report): HistoryRow {
  const scores = (report.lighthouse ?? [])
    .map(entry => entry.metrics.performance)
    .filter((score): score is number => typeof score === 'number')
  return {
    key,
    timestamp: report.meta.timestamp,
    pages: report.meta.pagesAudited,
    errors: report.issues.filter(i => i.severity === 'error').length,
    warnings: report.issues.filter(i => i.severity === 'warn').length,
    performance: scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : undefined,
  }
}

export function formatHistory(rows: HistoryRow[], csv = false): string {
  if (rows.length === 0) return 'No stored reports found.\n'
  if (csv) {
    const header = 'timestamp,pages,errors,warnings,performance'
    const lines = rows.map(row =>
      [row.timestamp, row.pages, row.errors, row.warnings, row.performance ?? ''].join(','))
    return `${[header, ...lines].join('\n')}\n`
  }
  const header = `${'timestamp'.padEnd(26)}${'pages'.padStart(6)}${'errors'.padStart(8)}${'warns'.padStart(7)}${'perf'.padStart(6)}`
  const lines = rows.map((row) => {
    const perf = row.performance === undefined ? '—' : String(row.performance)
    return `${row.timestamp.padEnd(26)}${String(row.pages).padStart(6)}${String(row.errors).padStart(8)}${String(row.warnings).padStart(7)}${perf.padStart(6)}`
  })
  return `${[header, ...lines].join('\n')}\n`
}

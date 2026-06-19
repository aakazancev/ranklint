import type { Report } from '@ranklint/core'

export function json(report: Report): string {
  return JSON.stringify(report, null, 2)
}

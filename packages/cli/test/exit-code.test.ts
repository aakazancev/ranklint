import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { exitCodeFor } from '../src/exit-code'

function report(severities: ('error' | 'warn' | 'info')[]): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 1 },
    issues: severities.map((severity, i) => ({
      checkId: `check:${i}`,
      severity,
      message: 'm',
      url: 'https://x.com/',
    })),
    crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
  }
}

describe('exitCodeFor', () => {
  it('returns 1 when any error is present', () => {
    expect(exitCodeFor(report(['warn', 'error', 'info']))).toBe(1)
  })

  it('returns 0 for warnings/info only and for empty report', () => {
    expect(exitCodeFor(report(['warn', 'info']))).toBe(0)
    expect(exitCodeFor(report([]))).toBe(0)
  })
})

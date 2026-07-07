import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '@ranklint/core'
import { FsReportStorage } from '@ranklint/core'
import { runCommand } from 'citty'
import { describe, expect, it, vi } from 'vitest'
import { history } from '../src/commands/history'
import { formatHistory, historyRow } from '../src/history'

function report(timestamp: string, errors: number, performance?: number): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp, pagesAudited: 5 },
    issues: [
      ...Array.from({ length: errors }, (_, i) => ({
        checkId: 'meta:title-required',
        severity: 'error' as const,
        message: 'x',
        url: `https://x.com/${i}`,
      })),
      { checkId: 'http:ttfb-budget', severity: 'warn' as const, message: 'y', url: 'https://x.com' },
    ],
    lighthouse: performance === undefined
      ? undefined
      : [{ url: 'https://x.com/', runs: 1, aggregation: 'median', metrics: { performance } }],
    crawlStats: { visited: 5, skipped: 0, external: 0, ignored: 0 },
  }
}

describe('historyRow and formatHistory', () => {
  it('aggregates counts and average lighthouse performance', () => {
    const row = historyRow('k', report('2026-07-01T00:00:00.000Z', 2, 90))
    expect(row).toMatchObject({ pages: 5, errors: 2, warnings: 1, performance: 90 })
    const table = formatHistory([row])
    expect(table).toContain('2026-07-01T00:00:00.000Z')
    expect(formatHistory([row], true)).toContain('2026-07-01T00:00:00.000Z,5,2,1,90')
    expect(formatHistory([])).toContain('No stored reports')
  })
})

describe('history command', () => {
  it('prints a trend table from stored reports', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-history-'))
    const storage = new FsReportStorage(dir)
    await storage.save(report('2026-07-01T00:00:00.000Z', 1), 'a')
    await new Promise(r => setTimeout(r, 20))
    await storage.save(report('2026-07-02T00:00:00.000Z', 3, 88), 'b')
    let output = ''
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk)
      return true
    })
    await runCommand(history, { rawArgs: ['--dir', dir] })
    spy.mockRestore()
    const lines = output.trim().split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[1]).toContain('2026-07-01')
    expect(lines[2]).toContain('2026-07-02')
    expect(lines[2]).toContain('88')
  })
})

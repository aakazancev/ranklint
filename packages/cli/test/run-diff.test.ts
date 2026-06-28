import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { diffExitCode, runDiff } from '../src/run-diff'

function report(issues: Report['issues']): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 1 },
    issues,
    pages: ['/'],
    crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
  }
}

const brokenH1: Report['issues'][0] = {
  checkId: 'headings:single-h1',
  severity: 'error',
  message: '0 h1',
  url: 'https://x.com/',
}

async function writeReport(r: Report): Promise<string> {
  const file = join(await mkdtemp(join(tmpdir(), 'ranklint-')), 'report.json')
  await writeFile(file, JSON.stringify(r))
  return file
}

describe('runDiff', () => {
  it('diffs two report files', async () => {
    const base = await writeReport(report([]))
    const current = await writeReport(report([brokenH1]))
    const result = await runDiff({ base, currentFile: current })
    expect(result.firstRun).toBe(false)
    expect(result.diff?.newIssues).toHaveLength(1)
    expect(diffExitCode(result)).toBe(1)
  })

  it('falls back to remote loader for non-file base and handles first run', async () => {
    const current = await writeReport(report([brokenH1]))
    const result = await runDiff({
      base: 'main',
      currentFile: current,
      loadBase: async () => null,
    })
    expect(result.firstRun).toBe(true)
    expect(diffExitCode(result)).toBe(1)
  })

  it('exit 0 when new issues are warnings only', async () => {
    const base = await writeReport(report([]))
    const current = await writeReport(report([{ ...brokenH1, severity: 'warn' }]))
    const result = await runDiff({ base, currentFile: current })
    expect(diffExitCode(result)).toBe(0)
  })

  it('rejects non-report current file', async () => {
    const bogus = join(await mkdtemp(join(tmpdir(), 'ranklint-')), 'x.json')
    await writeFile(bogus, '{"foo": 1}')
    await expect(runDiff({ base: 'main', currentFile: bogus })).rejects.toThrow('formatVersion')
  })
})

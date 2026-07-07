import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '@ranklint/core'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

describe('runDiff adapter selection and error policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('propagates loader failures instead of masking them as first run', async () => {
    const current = await writeReport(report([]))
    await expect(runDiff({
      base: 'main',
      currentFile: current,
      loadBase: async () => {
        throw new Error('401 bad token')
      },
    })).rejects.toThrow('401 bad token')
  })

  it('uses the github adapter in github actions and surfaces api errors', async () => {
    const server = createServer((_req, res) => {
      res.writeHead(500)
      res.end()
    })
    await new Promise<void>(r => server.listen(0, () => r()))
    const address = server.address()
    vi.stubEnv('GITHUB_ACTIONS', 'true')
    vi.stubEnv('GITHUB_REPOSITORY', 'acme/shop')
    vi.stubEnv('GITHUB_API_URL', `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`)
    const current = await writeReport(report([]))
    await expect(runDiff({ base: 'main', currentFile: current })).rejects.toThrow('500')
    await new Promise<void>(r => server.close(() => r()))
  })

  it('degrades to first run when no ci storage is configured', async () => {
    vi.stubEnv('GITHUB_ACTIONS', '')
    vi.stubEnv('CI_API_V4_URL', '')
    vi.stubEnv('CI_PROJECT_ID', '')
    const current = await writeReport(report([]))
    const result = await runDiff({ base: 'main', currentFile: current })
    expect(result.firstRun).toBe(true)
  })
})

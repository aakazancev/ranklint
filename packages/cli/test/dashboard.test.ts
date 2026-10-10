import { mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '@ranklint/core'
import { FsReportStorage } from '@ranklint/core'
import { runCommand } from 'citty'
import { describe, expect, it, vi } from 'vitest'
import { dashboard } from '../src/commands/dashboard'
import { writeDashboard } from '../src/dashboard'

function report(timestamp: string, errors: number): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp, pagesAudited: 3 },
    issues: Array.from({ length: errors }, (_, i) => ({
      checkId: 'meta:title-required',
      severity: 'error' as const,
      message: 'x',
      url: `https://x.com/${i}`,
    })),
    crawlStats: { visited: 3, skipped: 0, external: 0, ignored: 0 },
  }
}

async function seed(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ranklint-dashboard-'))
  const storage = new FsReportStorage(join(dir, 'reports'))
  await storage.save(report('2026-07-01T00:00:00.000Z', 1), '2026-07-01T00:00:00.000Z')
  await new Promise(r => setTimeout(r, 20))
  await storage.save(report('2026-07-02T00:00:00.000Z', 2), '2026-07-02T00:00:00.000Z')
  return dir
}

describe('writeDashboard', () => {
  it('writes index.html and a page per run', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    const index = await writeDashboard({ dir: join(dir, 'reports'), out })
    expect(index).toBe(join(out, 'index.html'))
    const runs = (await readdir(join(out, 'runs'))).sort()
    expect(runs).toEqual(['2026-07-01T00_00_00.000Z.html', '2026-07-02T00_00_00.000Z.html'])
    const indexHtml = await readFile(index, 'utf8')
    expect(indexHtml).toContain('href="runs/2026-07-02T00_00_00.000Z.html"')
    expect(indexHtml).toContain('<svg')
    const run = await readFile(join(out, 'runs', runs[0]!), 'utf8')
    expect(run).toContain('Ranklint report')
  })

  it('removes stale run pages', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    await mkdir(join(out, 'runs'), { recursive: true })
    await writeFile(join(out, 'runs', 'stale.html'), 'old')
    await writeDashboard({ dir: join(dir, 'reports'), out })
    expect(await readdir(join(out, 'runs'))).not.toContain('stale.html')
  })

  it('applies limit by report timestamp, not file mtime', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-dashboard-'))
    const storage = new FsReportStorage(join(dir, 'reports'))
    await storage.save(report('2026-07-02T00:00:00.000Z', 2), 'newer')
    await new Promise(r => setTimeout(r, 20))
    await storage.save(report('2026-07-01T00:00:00.000Z', 1), 'older')
    const out = join(dir, 'site')
    await writeDashboard({ dir: join(dir, 'reports'), out, limit: 1 })
    expect(await readdir(join(out, 'runs'))).toEqual(['newer.html'])
  })

  it('respects limit', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    await writeDashboard({ dir: join(dir, 'reports'), out, limit: 1 })
    expect(await readdir(join(out, 'runs'))).toEqual(['2026-07-02T00_00_00.000Z.html'])
  })
})

describe('dashboard command', () => {
  it.each(['0', '-1', 'abc', '1.5'])('rejects --limit %s', async (limit) => {
    const dir = await seed()
    await expect(runCommand(dashboard, { rawArgs: ['--dir', join(dir, 'reports'), '--out', join(dir, 'public'), '--limit', limit] }))
      .rejects.toThrow('--limit must be a positive integer')
  })

  it('prints the index path', async () => {
    const dir = await seed()
    const out = join(dir, 'public')
    let output = ''
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += String(chunk)
      return true
    })
    await runCommand(dashboard, { rawArgs: ['--cwd', dir, '--dir', join(dir, 'reports'), '--out', out, '--run-url', 'https://ci.example/new'] })
    spy.mockRestore()
    expect(output.trim()).toBe(join(out, 'index.html'))
    expect(await readFile(join(out, 'index.html'), 'utf8')).toContain('href="https://ci.example/new"')
  })
})

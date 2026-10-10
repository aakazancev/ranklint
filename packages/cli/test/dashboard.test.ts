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
    expect(run).toContain('<title>ranklint report · x.com')
    expect(run).toContain('data-mode="page"')
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

  it('passes the previous run, dashboard link and brand to run pages', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    await writeFile(join(dir, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>')
    await writeDashboard({ dir: join(dir, 'reports'), out, logo: join(dir, 'logo.svg'), brandName: 'Acme', accent: '#1e6bff' })
    const run = await readFile(join(out, 'runs', '2026-07-02T00_00_00.000Z.html'), 'utf8')
    const logo = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>').toString('base64')}`
    expect(run).toContain(`<img class="brand-logo" src="${logo}" alt="Acme">`)
    expect(run).toContain('href="../index.html"')
    expect(run).toContain('vs 1 Jul, 00:00 UTC')
    expect(run).toContain('--accent:#1e6bff')
    const first = await readFile(join(out, 'runs', '2026-07-01T00_00_00.000Z.html'), 'utf8')
    expect(first).not.toContain('vs 1 Jul, 00:00 UTC')
    const index = await readFile(join(out, 'index.html'), 'utf8')
    expect(index).toContain(`src="${logo}"`)
    expect(index).toContain('powered by')
  })

  it('keeps remote logos as urls', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    await writeDashboard({ dir: join(dir, 'reports'), out, logo: 'https://cdn.example.com/logo.png' })
    expect(await readFile(join(out, 'index.html'), 'utf8')).toContain('src="https://cdn.example.com/logo.png" alt="logo"')
  })

  it('rejects bad logos and accents', async () => {
    const dir = await seed()
    const out = join(dir, 'site')
    await writeFile(join(dir, 'logo.gif'), 'GIF89a')
    await writeFile(join(dir, 'big.png'), Buffer.alloc(201 * 1024))
    await expect(writeDashboard({ dir: join(dir, 'reports'), out, logo: join(dir, 'logo.gif') })).rejects.toThrow('--logo must be a .png, .svg, .jpg, .jpeg or .webp file')
    await expect(writeDashboard({ dir: join(dir, 'reports'), out, logo: join(dir, 'big.png') })).rejects.toThrow('--logo file is larger than 200 KB')
    await expect(writeDashboard({ dir: join(dir, 'reports'), out, logo: join(dir, 'missing.png') })).rejects.toThrow('--logo file not found')
    await expect(writeDashboard({ dir: join(dir, 'reports'), out, accent: 'blue' })).rejects.toThrow('--accent must be a hex color like #1e6bff, got "blue"')
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

  it('passes brand flags through', async () => {
    const dir = await seed()
    const out = join(dir, 'public')
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    await runCommand(dashboard, { rawArgs: ['--cwd', dir, '--dir', join(dir, 'reports'), '--out', out, '--logo', 'https://cdn.example.com/l.png', '--brand-name', 'Acme', '--accent', '#fc0'] })
    spy.mockRestore()
    const index = await readFile(join(out, 'index.html'), 'utf8')
    expect(index).toContain('alt="Acme"')
    expect(index).toContain('--accent:#fc0;--accent-ink:#0a0b0d')
    await expect(runCommand(dashboard, { rawArgs: ['--cwd', dir, '--dir', join(dir, 'reports'), '--out', out, '--accent', 'nope'] }))
      .rejects.toThrow('--accent must be a hex color')
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

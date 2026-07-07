import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '@ranklint/core'
import { runCommand } from 'citty'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { audit } from '../src/commands/audit'
import { diff } from '../src/commands/diff'
import { generate } from '../src/commands/generate'

function report(issues: Report['issues']): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: '2026-01-01T00:00:00.000Z', pagesAudited: 1 },
    issues,
    crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
  }
}

const brokenTitle = {
  checkId: 'meta:title-required',
  severity: 'error' as const,
  message: 'Page has no <title>',
  url: 'https://x.com/',
}

afterEach(() => {
  process.exitCode = 0
  vi.unstubAllEnvs()
})

describe('generate robots-fragment', () => {
  it('writes a fragment built from seo.config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-cmd-'))
    await writeFile(join(dir, 'seo.config.mjs'), `export default {
      site: { url: 'https://shop.example.com' },
      apps: { self: { paths: ['/shop/**'] } },
      robots: { expect: { disallow: ['/shop/cart*'], sitemaps: ['https://shop.example.com/sitemap.xml'] } },
    }`)
    const output = join(dir, 'fragment.txt')
    await runCommand(generate, { rawArgs: ['robots-fragment', '--cwd', dir, '--output', output] })
    const fragment = await readFile(output, 'utf8')
    expect(fragment).toContain('# ranklint fragment for https://shop.example.com')
    expect(fragment).toContain('Disallow: /shop/cart')
    expect(fragment).toContain('Sitemap: https://shop.example.com/sitemap.xml')
  })
})

describe('diff command', () => {
  it('diffs two report files and sets exit code for new errors', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-cmd-'))
    const basePath = join(dir, 'base.json')
    const currentPath = join(dir, 'current.json')
    const output = join(dir, 'diff.md')
    await writeFile(basePath, JSON.stringify(report([])))
    await writeFile(currentPath, JSON.stringify(report([brokenTitle])))
    await runCommand(diff, { rawArgs: ['--base', basePath, '--current', currentPath, '--output', output] })
    expect(await readFile(output, 'utf8')).toContain('meta:title-required')
    expect(process.exitCode).toBe(1)
  })

  it('degrades to full report on missing base', async () => {
    vi.stubEnv('GITHUB_ACTIONS', '')
    vi.stubEnv('CI_API_V4_URL', '')
    vi.stubEnv('CI_PROJECT_ID', '')
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-cmd-'))
    const currentPath = join(dir, 'current.json')
    const output = join(dir, 'diff.md')
    await writeFile(currentPath, JSON.stringify(report([])))
    await runCommand(diff, {
      rawArgs: ['--base', join(dir, 'missing.json'), '--current', currentPath, '--output', output],
    })
    expect(await readFile(output, 'utf8')).toContain('First run')
    expect(process.exitCode).toBe(0)
  })
})

describe('audit command argument validation', () => {
  it('requires --url or --start', async () => {
    await expect(runCommand(audit, { rawArgs: [] })).rejects.toThrow('--url')
  })

  it('rejects unknown reporters', async () => {
    await expect(runCommand(audit, { rawArgs: ['--url', 'https://x.com', '--reporter', 'nope'] }))
      .rejects.toThrow('Unknown reporter')
  })
})

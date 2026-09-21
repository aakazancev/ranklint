import { mkdir, mkdtemp, readFile, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadRanklintConfig } from '@ranklint/core'
import { runCommand } from 'citty'
import { describe, expect, it } from 'vitest'
import { init } from '../src/commands/init'
import { buildInitConfig, ciSnippet, detectNuxt, parseZones } from '../src/init'

const corePackage = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'core')

async function tempProject(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
  await mkdir(join(dir, 'node_modules', '@ranklint'), { recursive: true })
  await symlink(corePackage, join(dir, 'node_modules', '@ranklint', 'core'), 'dir')
  return dir
}

describe('buildInitConfig', () => {
  it('writes a minimal config with the site url', () => {
    const source = buildInitConfig({ url: 'https://example.com' })
    expect(source).toContain('import { defineRanklintConfig } from \'@ranklint/core\'')
    expect(source).toContain('site: { url: \'https://example.com\' }')
    expect(source).not.toContain('profiles')
    expect(source).not.toContain('apps')
  })

  it('adds a uat profile', () => {
    const source = buildInitConfig({ url: 'https://example.com', uat: 'https://uat.example.com' })
    expect(source).toContain('profiles: {')
    expect(source).toContain('uat: { site: { url: \'https://uat.example.com\' } },')
  })

  it('adds zones as apps', () => {
    const source = buildInitConfig({ url: 'https://example.com', zones: ['/en/market/**', '/ar/market/**'] })
    expect(source).toContain('self: { paths: [\'/en/market/**\', \'/ar/market/**\'] },')
    expect(source).toContain('main: { paths: [\'/**\'], owner: \'external\' },')
  })

  it('adds fs monitor storage', () => {
    const source = buildInitConfig({ url: 'https://example.com', monitor: true })
    expect(source).toContain('monitor: { storage: \'fs\', dir: \'.ranklint/reports\' },')
  })

  it('produces a config that loadRanklintConfig accepts', async () => {
    const dir = await tempProject()
    await writeFile(join(dir, 'ranklint.config.ts'), buildInitConfig({
      url: 'https://example.com',
      uat: 'https://uat.example.com',
      zones: ['/en/market/**'],
      monitor: true,
    }))
    const config = await loadRanklintConfig({ cwd: dir })
    expect(config.site.url).toBe('https://example.com')
    expect(config.apps?.self?.paths).toEqual(['/en/market/**'])
    expect(config.monitor?.dir).toBe('.ranklint/reports')
    const uat = await loadRanklintConfig({ cwd: dir, profile: 'uat' })
    expect(uat.site.url).toBe('https://uat.example.com')
  })
})

describe('parseZones', () => {
  it('splits a comma separated list', () => {
    expect(parseZones(' /en/market/** , /ar/market/** ,')).toEqual(['/en/market/**', '/ar/market/**'])
  })
})

describe('ciSnippet', () => {
  it('prints the gitlab include and the audit job', () => {
    const snippet = ciSnippet('gitlab', 'https://example.com')
    expect(snippet).toContain('remote: \'https://raw.githubusercontent.com/aakazancev/ranklint/main/presets/gitlab-ci/seo.yml\'')
    expect(snippet).toContain('extends: .ranklint-audit')
    expect(snippet).toContain('RANKLINT_URL: https://example.com')
  })

  it('prints the github reusable workflow', () => {
    const snippet = ciSnippet('github', 'https://example.com')
    expect(snippet).toContain('uses: aakazancev/ranklint/.github/workflows/seo.yml@main')
    expect(snippet).toContain('url: \'https://example.com\'')
  })

  it('is empty for none', () => {
    expect(ciSnippet('none', 'https://example.com')).toBe('')
  })
})

describe('detectNuxt', () => {
  it('is true for a nuxt project without the module', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await writeFile(join(dir, 'nuxt.config.ts'), 'export default {}\n')
    expect(await detectNuxt(dir)).toBe(true)
  })

  it('is false when the module is already installed', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await writeFile(join(dir, 'nuxt.config.ts'), 'export default {}\n')
    await writeFile(join(dir, 'package.json'), JSON.stringify({ devDependencies: { '@ranklint/nuxt': '^0.5.0' } }))
    expect(await detectNuxt(dir)).toBe(false)
  })

  it('is false without a nuxt config', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    expect(await detectNuxt(dir)).toBe(false)
  })
})

describe('init command', () => {
  it('requires --url with --yes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await expect(runCommand(init, { rawArgs: ['--yes', '--cwd', dir] })).rejects.toThrow('--url')
  })

  it('rejects a relative url', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await expect(runCommand(init, { rawArgs: ['--yes', '--url', 'example.com', '--cwd', dir] })).rejects.toThrow('absolute http')
  })

  it('fails without a TTY when --yes is missing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await expect(runCommand(init, { rawArgs: ['--cwd', dir] })).rejects.toThrow('use --yes with --url')
  })

  it('writes ranklint.config.ts non-interactively', async () => {
    const dir = await tempProject()
    await runCommand(init, { rawArgs: ['--yes', '--url', 'https://example.com', '--uat', 'https://uat.example.com', '--zones', '/en/market/**,/ar/market/**', '--ci', 'github', '--cwd', dir] })
    const source = await readFile(join(dir, 'ranklint.config.ts'), 'utf8')
    expect(source).toContain('site: { url: \'https://example.com\' }')
    expect(source).toContain('uat: { site: { url: \'https://uat.example.com\' } },')
    expect(source).toContain('self: { paths: [\'/en/market/**\', \'/ar/market/**\'] },')
  })

  it('keeps an existing config without --force', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-init-'))
    await writeFile(join(dir, 'ranklint.config.ts'), '// mine\n')
    await runCommand(init, { rawArgs: ['--yes', '--url', 'https://example.com', '--cwd', dir] })
    expect(await readFile(join(dir, 'ranklint.config.ts'), 'utf8')).toBe('// mine\n')
  })

  it('overwrites with --force', async () => {
    const dir = await tempProject()
    await writeFile(join(dir, 'ranklint.config.ts'), '// mine\n')
    await runCommand(init, { rawArgs: ['--yes', '--url', 'https://example.com', '--force', '--cwd', dir] })
    expect(await readFile(join(dir, 'ranklint.config.ts'), 'utf8')).toContain('defineRanklintConfig')
  })
})

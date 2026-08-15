import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { configSchema, loadRanklintConfig, resolveRules, type RuleRegistryEntry } from '../src/config'

const cwd = fileURLToPath(new URL('./fixtures/config', import.meta.url))

describe('loadRanklintConfig', () => {
  it('loads seo.config.ts', async () => {
    const config = await loadRanklintConfig({ cwd })
    expect(config.site.url).toBe('https://car-market.com')
    expect(config.crawl?.concurrency).toBe(5)
    expect(config.rules?.['meta:title-length']).toEqual(['error', { min: 30, max: 60 }])
  })

  it('applies profile as a patch over base config', async () => {
    const config = await loadRanklintConfig({ cwd, profile: 'prod' })
    expect(config.crawl?.concurrency).toBe(2)
    expect(config.crawl?.delay).toBe(500)
    expect(config.crawl?.maxPages).toBe(2000)
  })

  it('throws on unknown profile', async () => {
    await expect(loadRanklintConfig({ cwd, profile: 'nope' })).rejects.toThrow('Unknown profile')
  })

  it('throws when config is missing', async () => {
    await expect(loadRanklintConfig({ cwd: '/tmp' })).rejects.toThrow('not found')
  })
})

const registry = new Map<string, RuleRegistryEntry>([
  ['meta:title-length', {
    defaultSeverity: 'warn',
    schema: z.object({ min: z.number().optional(), max: z.number().optional() }),
  }],
  ['headings:single-h1', { defaultSeverity: 'error' }],
])

describe('resolveRules', () => {
  it('starts from registry defaults', () => {
    const rules = resolveRules(undefined, registry)
    expect(rules.get('meta:title-length')).toEqual({ severity: 'warn', options: {} })
    expect(rules.get('headings:single-h1')).toEqual({ severity: 'error', options: {} })
  })

  it('applies user severity and validated options', () => {
    const rules = resolveRules({
      'meta:title-length': ['error', { min: 30, max: 60 }],
      'headings:single-h1': 'off',
    }, registry)
    expect(rules.get('meta:title-length')).toEqual({ severity: 'error', options: { min: 30, max: 60 } })
    expect(rules.get('headings:single-h1')).toBe('off')
  })

  it('rejects invalid options with rule id in message', () => {
    expect(() => resolveRules({ 'meta:title-length': ['error', { min: 'x' }] }, registry))
      .toThrow('meta:title-length')
  })

  it('suggests similar rule on typo', () => {
    expect(() => resolveRules({ 'meta:title-lenght': 'error' }, registry))
      .toThrow('Did you mean "meta:title-length"?')
  })
})

describe('crawl.insecureTls', () => {
  it('accepts the flag', () => {
    const parsed = configSchema.safeParse({ site: { url: 'https://x.com' }, crawl: { insecureTls: true } })
    expect(parsed.success).toBe(true)
  })
})

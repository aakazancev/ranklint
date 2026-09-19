import { fileURLToPath } from 'node:url'
import { loadRanklintConfig } from '@ranklint/core'
import { describe, expect, it } from 'vitest'

const cwd = fileURLToPath(new URL('./fixtures/preset-extends', import.meta.url))

describe('presets via extends', () => {
  it('layers default preset, third-party preset and user config', async () => {
    const config = await loadRanklintConfig({ cwd })
    expect(config.site.url).toBe('https://preset-demo.com')
    expect(config.rules?.['meta:title-required']).toBe('error')
    expect(config.rules?.['meta:title-length']).toEqual(['warn', { min: 20, max: 70 }])
    expect(config.rules?.['images:alt-required']).toBe('error')
  })

  it('carries customChecks from a preset layer', async () => {
    const config = await loadRanklintConfig({ cwd })
    expect(config.customChecks?.map(c => c.id)).toEqual(['agency:no-lorem'])
    expect(config.rules?.['agency:no-lorem']).toBe('warn')
  })
})

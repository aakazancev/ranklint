import { describe, expect, it } from 'vitest'
import { allChecks } from '@ranklint/checks'
import preset, { rules } from '../src/index'

describe('@ranklint/preset-default', () => {
  it('snapshots every built-in rule at its default severity', () => {
    expect(Object.keys(rules)).toHaveLength(allChecks.length)
    expect(rules['meta:title-required']).toBe('error')
    expect(rules['meta:title-length']).toBe('warn')
  })

  it('default-exports a config fragment consumable via extends', () => {
    expect(preset).toEqual({ rules })
  })
})

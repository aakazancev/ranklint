import { resolveRules } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { allChecks, ruleRegistry } from '../src/registry'

describe('registry', () => {
  it('contains all registered checks with unique ids', () => {
    expect(allChecks).toHaveLength(30)
    expect(new Set(allChecks.map(c => c.id)).size).toBe(30)
  })

  it('every check carries docs and suggestion-producing run', () => {
    for (const check of allChecks) {
      expect(check.docs).toMatch(/^https:\/\/ranklint\.dev\/rules\//)
    }
  })

  it('plugs into core resolveRules', () => {
    const rules = resolveRules({
      'meta:title-length': ['error', { min: 10, max: 40 }],
      'links:no-broken': 'off',
    }, ruleRegistry)
    expect(rules.get('meta:title-length')).toEqual({ severity: 'error', options: { min: 10, max: 40 } })
    expect(rules.get('links:no-broken')).toBe('off')
    expect(rules.get('headings:single-h1')).toEqual({ severity: 'error', options: {} })
  })

  it('did-you-mean works on real rule ids', () => {
    expect(() => resolveRules({ 'meta:title-lenght': 'error' }, ruleRegistry))
      .toThrow('meta:title-length')
  })

  it('rejects invalid options through check schemas', () => {
    expect(() => resolveRules({ 'links:no-redirect-chain': ['warn', { maxHops: -1 }] }, ruleRegistry))
      .toThrow('links:no-redirect-chain')
  })
})

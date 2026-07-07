import { describe, expect, it } from 'vitest'
import { level1Checks } from '../src/level1'
import { allChecks } from '../src/registry'

const NETWORK_OR_SSR = new Set([
  'canonical:valid',
  'links:no-broken',
  'links:no-redirect-chain',
  'links:permanent-redirects',
  'hreflang:valid-targets',
  'indexability:ssr-content',
])

describe('level1Checks', () => {
  it('contains only page-scope checks', () => {
    for (const check of level1Checks) expect(check.scope).toBe('page')
  })

  it('excludes network and ssr checks', () => {
    const ids = new Set(level1Checks.map(c => c.id))
    for (const id of NETWORK_OR_SSR) expect(ids).not.toContain(id)
  })

  it('covers every other page-scope check from the registry', () => {
    const expected = allChecks
      .filter(c => c.scope === 'page' && !NETWORK_OR_SSR.has(c.id))
      .map(c => c.id)
      .sort()
    expect(level1Checks.map(c => c.id).sort()).toEqual(expected)
  })
})

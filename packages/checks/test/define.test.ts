import { describe, expect, it } from 'vitest'
import { docsUrl } from '../src/define'
import { allChecks } from '../src/registry'

describe('docsUrl', () => {
  it('points at the rule page on the docs site', () => {
    expect(docsUrl('meta:title-length')).toBe('https://ranklint.dev/en/rules/meta/meta-title-length')
  })

  it('every registered check has a docs url in its own category', () => {
    for (const check of allChecks) {
      expect(check.docs).toBe(`https://ranklint.dev/en/rules/${check.category}/${check.id.replace(/:/g, '-')}`)
    }
  })
})

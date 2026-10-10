import { describe, expect, it } from 'vitest'
import { matchPattern, mostSpecific, patternSpecificity } from '../src/route-pattern'

describe('matchPattern', () => {
  it('matches everything with /**', () => {
    expect(matchPattern('/**', '/')).toBe(true)
    expect(matchPattern('/**', '/a/b/c')).toBe(true)
  })

  it('matches subtree with /market/**', () => {
    expect(matchPattern('/market/**', '/market')).toBe(true)
    expect(matchPattern('/market/**', '/market/cars/123')).toBe(true)
    expect(matchPattern('/market/**', '/marketing')).toBe(false)
    expect(matchPattern('/market/**', '/')).toBe(false)
  })

  it('matches single segment with *', () => {
    expect(matchPattern('/listing/*', '/listing/42')).toBe(true)
    expect(matchPattern('/listing/*', '/listing/42/photos')).toBe(false)
    expect(matchPattern('/listing/*', '/listing')).toBe(false)
  })

  it('matches a glob prefix before /**', () => {
    expect(matchPattern('/*/market/**', '/en/market/cars')).toBe(true)
    expect(matchPattern('/*/market/**', '/en/market')).toBe(true)
    expect(matchPattern('/*/market/**', '/en/marketing')).toBe(false)
    expect(matchPattern('/*/market/**', '/market/cars')).toBe(false)
    expect(matchPattern('/*/market/**', '/en/x/market')).toBe(false)
  })

  it('escapes regexp characters in a literal prefix', () => {
    expect(matchPattern('/a.b/**', '/a.b/c')).toBe(true)
    expect(matchPattern('/a.b/**', '/axb/c')).toBe(false)
  })

  it('matches exact paths', () => {
    expect(matchPattern('/about', '/about')).toBe(true)
    expect(matchPattern('/about', '/about/team')).toBe(false)
  })
})

describe('specificity', () => {
  it('ranks literal patterns above wildcards', () => {
    expect(patternSpecificity('/market/**')).toBeGreaterThan(patternSpecificity('/**'))
    expect(patternSpecificity('/market/cars')).toBeGreaterThan(patternSpecificity('/market/**'))
  })

  it('picks the most specific matching pattern', () => {
    expect(mostSpecific(['/**', '/market/**'], '/market/x')).toBe('/market/**')
    expect(mostSpecific(['/**', '/market/**'], '/other')).toBe('/**')
    expect(mostSpecific(['/market/**'], '/other')).toBeUndefined()
  })
})

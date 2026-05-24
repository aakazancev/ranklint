import { describe, expect, it } from 'vitest'
import { normalizeUrl } from '../src/url'
import { classifyUrl } from '../src/zones'

describe('normalizeUrl', () => {
  it('resolves relative and strips hash, keeps query', () => {
    expect(normalizeUrl('/a#top', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?f=1', 'https://x.com')).toBe('https://x.com/a?f=1')
    expect(normalizeUrl('b', 'https://x.com/a/')).toBe('https://x.com/a/b')
  })

  it('returns null for garbage', () => {
    expect(normalizeUrl('http://', 'not-a-base')).toBeNull()
  })
})

const multiApp = {
  siteUrl: 'https://car-market.com',
  apps: {
    self: { paths: ['/market/**'] },
    main: { paths: ['/**'], owner: 'external' as const },
  },
  ignore: ['/market/admin/**'],
}

describe('classifyUrl', () => {
  it('crawls everything on single-zone sites', () => {
    expect(classifyUrl('https://x.com/any/path', { siteUrl: 'https://x.com' }))
      .toEqual({ action: 'crawl', zone: 'self' })
  })

  it('classifies multi-app zones by most specific pattern', () => {
    expect(classifyUrl('https://car-market.com/market/cars/1', multiApp))
      .toEqual({ action: 'crawl', zone: 'self' })
    expect(classifyUrl('https://car-market.com/about', multiApp))
      .toEqual({ action: 'reachability', zone: 'main' })
  })

  it('ignore wins over zones', () => {
    expect(classifyUrl('https://car-market.com/market/admin/x', multiApp))
      .toEqual({ action: 'skip' })
  })

  it('foreign origin is external', () => {
    expect(classifyUrl('https://google.com/', multiApp)).toEqual({ action: 'external' })
  })

  it('unparseable url is skipped', () => {
    expect(classifyUrl('http://', { siteUrl: 'https://x.com' })).toEqual({ action: 'skip' })
  })
})

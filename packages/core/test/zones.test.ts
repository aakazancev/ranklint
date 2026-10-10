import { describe, expect, it } from 'vitest'
import { normalizeUrl } from '../src/url'
import { classifyUrl } from '../src/zones'

describe('normalizeUrl', () => {
  it('resolves relative and strips hash, keeps query', () => {
    expect(normalizeUrl('/a#top', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?f=1', 'https://x.com')).toBe('https://x.com/a?f=1')
    expect(normalizeUrl('b', 'https://x.com/a/')).toBe('https://x.com/a/b')
  })

  it('strips tracking params, keeps the rest in order', () => {
    expect(normalizeUrl('/a?utm_source=x&utm_medium=referral', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?b=2&utm_campaign=c&a=1&gclid=g', 'https://x.com')).toBe('https://x.com/a?b=2&a=1')
    expect(normalizeUrl('/a?gbraid=1&wbraid=2&fbclid=3&yclid=4&msclkid=5&_gl=6&mc_cid=7&mc_eid=8', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?utm=1&gl=2&q=a+b', 'https://x.com')).toBe('https://x.com/a?utm=1&gl=2&q=a+b')
    expect(normalizeUrl('/a?q=%20x&utm_term=y#top', 'https://x.com')).toBe('https://x.com/a?q=%20x')
  })

  it('drops empty pairs only when a tracking param was removed', () => {
    expect(normalizeUrl('/a?utm_source=x&', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?&utm_source=x', 'https://x.com')).toBe('https://x.com/a')
    expect(normalizeUrl('/a?b=1&&utm_source=x&c', 'https://x.com')).toBe('https://x.com/a?b=1&c')
    expect(normalizeUrl('/a?a=1&&b', 'https://x.com')).toBe('https://x.com/a?a=1&&b')
  })

  it('matches encoded tracking param names, keeps other pairs raw', () => {
    expect(normalizeUrl('/a?utm%5Fsource=x&q=a+b', 'https://x.com')).toBe('https://x.com/a?q=a+b')
    expect(normalizeUrl('/a?%E0%A4%A=1&utm_medium=y', 'https://x.com')).toBe('https://x.com/a?%E0%A4%A=1')
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

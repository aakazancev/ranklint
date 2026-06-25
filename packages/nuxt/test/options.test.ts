import { describe, expect, it } from 'vitest'
import { resolveRanklintOptions } from '../src/options'

describe('resolveRanklintOptions', () => {
  it('applies zero-config defaults', () => {
    const resolved = resolveRanklintOptions({})
    expect(resolved.sitemap).toEqual({
      path: '/sitemap.xml',
      urlSources: [],
      staticEntries: [],
      cacheTtl: 3600,
      routes: [],
    })
    expect(resolved.robots).toEqual({ mode: 'owner' })
    expect(resolved.jsonLd).toBe(true)
    expect(resolved.devtools).toBe(true)
  })

  it('strips trailing slash from site url and splits sources', () => {
    const resolved = resolveRanklintOptions({
      site: { url: 'https://example.com/' },
      sitemap: { sources: ['/api/urls', { loc: '/static-page' }], cacheTtl: 60 },
    })
    expect(resolved.siteUrl).toBe('https://example.com')
    if (resolved.sitemap === false) throw new Error('sitemap disabled')
    expect(resolved.sitemap.urlSources).toEqual(['/api/urls'])
    expect(resolved.sitemap.staticEntries).toEqual([{ loc: '/static-page' }])
    expect(resolved.sitemap.cacheTtl).toBe(60)
  })

  it('disables blocks explicitly', () => {
    expect(resolveRanklintOptions({ sitemap: false }).sitemap).toBe(false)
    expect(resolveRanklintOptions({ sitemap: { enabled: false } }).sitemap).toBe(false)
    expect(resolveRanklintOptions({ robots: false }).robots).toBe(false)
    expect(resolveRanklintOptions({ jsonLd: false }).jsonLd).toBe(false)
  })

  it('supports external robots mode', () => {
    expect(resolveRanklintOptions({ robots: { mode: 'external' } }).robots).toEqual({ mode: 'external' })
  })
})

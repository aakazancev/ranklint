import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, resolveIndexable } from '../src/runtime/server/utils/robots'

describe('resolveIndexable', () => {
  it('explicit override always wins', () => {
    expect(resolveIndexable('production', true)).toBe(true)
    expect(resolveIndexable('prod', false)).toBe(true)
    expect(resolveIndexable('uat', false)).toBe(false)
    expect(resolveIndexable('staging', false)).toBe(false)
  })

  it('falls back to dev flag', () => {
    expect(resolveIndexable(undefined, true)).toBe(false)
    expect(resolveIndexable(undefined, false)).toBe(true)
  })
})

describe('buildRobotsTxt', () => {
  it('closes non-indexable environments', () => {
    expect(buildRobotsTxt({ indexable: false })).toBe('User-agent: *\nDisallow: /\n')
  })

  it('opens production with sitemap directive', () => {
    expect(buildRobotsTxt({ indexable: true, sitemapUrl: 'https://x.com/sitemap.xml' }))
      .toBe('User-agent: *\nAllow: /\nSitemap: https://x.com/sitemap.xml\n')
  })

  it('omits sitemap line when unknown', () => {
    expect(buildRobotsTxt({ indexable: true })).toBe('User-agent: *\nAllow: /\n')
  })
})

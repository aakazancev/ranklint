import { describe, expect, it } from 'vitest'
import { buildSitemapXml } from '../src/runtime/server/utils/sitemap'

describe('buildSitemapXml', () => {
  it('renders urlset with absolute locs and dedup', () => {
    const xml = buildSitemapXml('https://x.com', [
      { loc: '/' },
      { loc: '/a', lastmod: '2026-01-01', changefreq: 'daily', priority: 0.8 },
      { loc: '/a' },
      { loc: 'https://x.com/full' },
    ])
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<loc>https://x.com/</loc>')
    expect(xml).toContain('<loc>https://x.com/a</loc>')
    expect(xml).toContain('<lastmod>2026-01-01</lastmod>')
    expect(xml).toContain('<changefreq>daily</changefreq>')
    expect(xml).toContain('<priority>0.8</priority>')
    expect(xml.match(/<loc>https:\/\/x\.com\/a<\/loc>/g)).toHaveLength(1)
  })

  it('escapes xml entities in locs', () => {
    const xml = buildSitemapXml('https://x.com', [{ loc: '/search?q=a&b=<c>' }])
    expect(xml).toContain('<loc>https://x.com/search?q=a&amp;b=&lt;c&gt;</loc>')
  })
})

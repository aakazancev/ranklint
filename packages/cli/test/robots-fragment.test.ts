import { describe, expect, it } from 'vitest'
import { buildRobotsFragment } from '../src/robots-fragment'

describe('buildRobotsFragment', () => {
  it('renders disallow rules and sitemap directives from expectations', () => {
    const fragment = buildRobotsFragment({
      site: { url: 'https://car-market.com' },
      apps: { self: { paths: ['/market/**'] } },
      robots: {
        mode: 'external',
        expect: {
          disallow: ['/market/api/**', '/market/admin/**'],
          sitemaps: ['https://car-market.com/market/sitemap.xml'],
        },
      },
    })
    expect(fragment).toContain('zone: /market/**')
    expect(fragment).toContain('Disallow: /market/api/')
    expect(fragment).toContain('Disallow: /market/admin/')
    expect(fragment).toContain('Sitemap: https://car-market.com/market/sitemap.xml')
  })

  it('renders a minimal header without expectations', () => {
    const fragment = buildRobotsFragment({ site: { url: 'https://x.com' } })
    expect(fragment).toContain('# ranklint fragment for https://x.com')
    expect(fragment).not.toContain('User-agent')
  })
})

import { describe, expect, it } from 'vitest'
import { isPathDisallowed, parseRobotsTxt } from '../src/robots-parser'

const robots = `
# comment
User-agent: *
Disallow: /admin/
Allow: /admin/public
Sitemap: https://x.com/sitemap.xml

User-agent: badbot
User-agent: otherbot
Disallow: /
`

describe('parseRobotsTxt', () => {
  it('parses groups, rules and sitemaps', () => {
    const parsed = parseRobotsTxt(robots)
    expect(parsed.groups).toHaveLength(2)
    expect(parsed.groups[0]).toEqual({ userAgents: ['*'], allow: ['/admin/public'], disallow: ['/admin/'] })
    expect(parsed.groups[1]?.userAgents).toEqual(['badbot', 'otherbot'])
    expect(parsed.sitemaps).toEqual(['https://x.com/sitemap.xml'])
  })
})

describe('isPathDisallowed', () => {
  const parsed = parseRobotsTxt(robots)

  it('applies longest match with allow winning ties', () => {
    expect(isPathDisallowed(parsed, '/admin/panel')).toBe(true)
    expect(isPathDisallowed(parsed, '/admin/public/page')).toBe(false)
    expect(isPathDisallowed(parsed, '/page')).toBe(false)
  })

  it('matches specific user agent group', () => {
    expect(isPathDisallowed(parsed, '/page', 'BadBot/1.0')).toBe(true)
  })

  it('closed site disallows everything', () => {
    const closed = parseRobotsTxt('User-agent: *\nDisallow: /')
    expect(isPathDisallowed(closed, '/')).toBe(true)
    expect(isPathDisallowed(closed, '/any')).toBe(true)
  })

  it('empty disallow allows everything', () => {
    const open = parseRobotsTxt('User-agent: *\nDisallow:')
    expect(isPathDisallowed(open, '/any')).toBe(false)
  })
})

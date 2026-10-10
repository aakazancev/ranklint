import { describe, expect, it } from 'vitest'
import { isPathDisallowed, parseRobotsTxt } from '../src/robots'

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

describe('isPathDisallowed with Google wildcards', () => {
  it('matches * anywhere in the pattern', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /*/flow/*\nDisallow: /*?*utm_*')
    expect(isPathDisallowed(parsed, '/en/flow/step1')).toBe(true)
    expect(isPathDisallowed(parsed, '/en/flowers')).toBe(false)
    expect(isPathDisallowed(parsed, '/en/page?utm_source=x')).toBe(true)
    expect(isPathDisallowed(parsed, '/en/page?a=1&utm_medium=y')).toBe(true)
    expect(isPathDisallowed(parsed, '/en/page_utm')).toBe(false)
  })

  it('anchors patterns ending with $', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /*.pdf$\nDisallow: /exact$')
    expect(isPathDisallowed(parsed, '/files/a.pdf')).toBe(true)
    expect(isPathDisallowed(parsed, '/files/a.pdf?x=1')).toBe(false)
    expect(isPathDisallowed(parsed, '/exact')).toBe(true)
    expect(isPathDisallowed(parsed, '/exact/more')).toBe(false)
  })

  it('treats regex metacharacters literally', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /a.b+(c)')
    expect(isPathDisallowed(parsed, '/a.b+(c)/x')).toBe(true)
    expect(isPathDisallowed(parsed, '/axbb(c)')).toBe(false)
  })

  it('picks the longest matching rule across allow and disallow', () => {
    const parsed = parseRobotsTxt('User-agent: *\nAllow: /p\nDisallow: /*.php\nAllow: /folder/*.php$\nDisallow: /folder')
    expect(isPathDisallowed(parsed, '/page.php')).toBe(true)
    expect(isPathDisallowed(parsed, '/folder/a.php')).toBe(false)
    expect(isPathDisallowed(parsed, '/folder/a.html')).toBe(true)
    expect(isPathDisallowed(parsed, '/page')).toBe(false)
  })

  it('lets allow win on equal length', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /*.htm\nAllow: /page*')
    expect(isPathDisallowed(parsed, '/page.htm')).toBe(false)
  })
})

describe('isPathDisallowed group selection', () => {
  it('uses the most specific user agent and merges its groups', () => {
    const parsed = parseRobotsTxt([
      'User-agent: *',
      'Disallow: /all',
      'User-agent: googlebot',
      'Disallow: /g',
      'User-agent: googlebot-news',
      'Disallow: /news',
      'User-agent: googlebot',
      'Disallow: /g2',
    ].join('\n'))
    expect(isPathDisallowed(parsed, '/news', 'Googlebot-News')).toBe(true)
    expect(isPathDisallowed(parsed, '/g', 'Googlebot-News')).toBe(false)
    expect(isPathDisallowed(parsed, '/g', 'Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isPathDisallowed(parsed, '/g2', 'Googlebot/2.1')).toBe(true)
    expect(isPathDisallowed(parsed, '/all', 'Googlebot/2.1')).toBe(false)
    expect(isPathDisallowed(parsed, '/all', 'SomeBot')).toBe(true)
  })

  it('merges multiple * groups', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /a\n\nUser-agent: *\nDisallow: /b')
    expect(isPathDisallowed(parsed, '/a')).toBe(true)
    expect(isPathDisallowed(parsed, '/b')).toBe(true)
  })
})

describe('isPathDisallowed percent-encoding', () => {
  it('matches non-ASCII rules against encoded paths', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /каталог/')
    expect(isPathDisallowed(parsed, new URL('https://x.com/каталог/item').pathname)).toBe(true)
    expect(isPathDisallowed(parsed, '/каталог/item')).toBe(true)
    expect(isPathDisallowed(parsed, '/catalog/item')).toBe(false)
  })

  it('compares percent-encoded hex case-insensitively', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /%d0%ba/')
    expect(isPathDisallowed(parsed, '/%D0%BA/x')).toBe(true)
    const upper = parseRobotsTxt('User-agent: *\nDisallow: /%D0%BA/')
    expect(isPathDisallowed(upper, '/%d0%ba/x')).toBe(true)
  })
})

describe('isPathDisallowed rule length after encoding', () => {
  it('lets a longer encoded non-ASCII allow beat a shorter ASCII disallow', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /*x\nAllow: /к')
    expect(isPathDisallowed(parsed, '/кx')).toBe(false)
  })

  it('compares encoded lengths of percent-encoded and raw rules', () => {
    const parsed = parseRobotsTxt('User-agent: *\nDisallow: /%D0%BA%D0%B0\nAllow: /каx')
    expect(isPathDisallowed(parsed, '/каx')).toBe(false)
  })
})

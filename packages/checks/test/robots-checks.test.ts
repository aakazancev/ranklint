import type { Check, CheckContext, PageFetcher, SiteConfig } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { robotsEnvPolicy, robotsExpectedDisallow, robotsReachable, robotsSitemapDeclared, robotsZoneNotBlocked } from '../src/checks/robots/robots'
import { stubFetcher } from '../src/test-utils'

function robotsFetcher(body: string, statusCode = 200, contentType = 'text/plain'): PageFetcher {
  return {
    ...stubFetcher,
    fetch: async url => ({
      url,
      html: body,
      statusCode,
      headers: { 'content-type': contentType },
      ttfb: 1,
      links: [],
    }),
  }
}

function run(check: Check, fetcher: PageFetcher, site: Partial<SiteConfig> = {}) {
  const ctx: CheckContext = {
    pages: [],
    config: { severity: check.severity, options: {} },
    site: { url: 'https://x.com', ...site },
    fetcher,
  }
  return check.run(ctx)
}

const openRobots = 'User-agent: *\nAllow: /\nSitemap: https://x.com/market/sitemap.xml'
const closedRobots = 'User-agent: *\nDisallow: /'

describe('robots:reachable', () => {
  it('passes for 200 text/plain', async () => {
    expect(await run(robotsReachable, robotsFetcher(openRobots))).toEqual([])
  })

  it('fails on 404 and wrong content-type', async () => {
    expect((await run(robotsReachable, robotsFetcher('', 404)))[0]?.message).toContain('404')
    expect((await run(robotsReachable, robotsFetcher(openRobots, 200, 'text/html')))[0]?.message).toContain('text/plain')
  })
})

describe('robots:zone-not-blocked', () => {
  const site = { apps: { self: { paths: ['/market/**'] } } }

  it('passes when zone is crawlable', async () => {
    expect(await run(robotsZoneNotBlocked, robotsFetcher(openRobots), site)).toEqual([])
  })

  it('fails when own zone is disallowed', async () => {
    const issues = await run(robotsZoneNotBlocked, robotsFetcher('User-agent: *\nDisallow: /market/'), site)
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('/market/')
  })
})

describe('robots:sitemap-declared', () => {
  const site = { robots: { expect: { sitemaps: ['https://x.com/market/sitemap.xml'] } } }

  it('passes when declared, silent without expectations', async () => {
    expect(await run(robotsSitemapDeclared, robotsFetcher(openRobots), site)).toEqual([])
    expect(await run(robotsSitemapDeclared, robotsFetcher(closedRobots))).toEqual([])
  })

  it('fails when sitemap directive is missing', async () => {
    const issues = await run(robotsSitemapDeclared, robotsFetcher(closedRobots), site)
    expect(issues[0]?.message).toContain('not declared')
  })
})

describe('robots:env-policy', () => {
  it('prod must be open', async () => {
    const site = { robots: { expect: { indexable: true } } }
    expect(await run(robotsEnvPolicy, robotsFetcher(openRobots), site)).toEqual([])
    expect((await run(robotsEnvPolicy, robotsFetcher(closedRobots), site))[0]?.message).toContain('must be indexable')
  })

  it('uat must be closed', async () => {
    const site = { robots: { expect: { indexable: false } } }
    expect(await run(robotsEnvPolicy, robotsFetcher(closedRobots), site)).toEqual([])
    expect((await run(robotsEnvPolicy, robotsFetcher(openRobots), site))[0]?.message).toContain('must be closed')
  })
})

describe('robots:expected-disallow', () => {
  const site = { robots: { expect: { disallow: ['/market/api/**'] } } }

  it('passes when service path is closed', async () => {
    expect(await run(robotsExpectedDisallow, robotsFetcher('User-agent: *\nDisallow: /market/api/'), site)).toEqual([])
  })

  it('fails when service path is crawlable', async () => {
    const issues = await run(robotsExpectedDisallow, robotsFetcher(openRobots), site)
    expect(issues[0]?.message).toContain('/market/api/')
  })
})

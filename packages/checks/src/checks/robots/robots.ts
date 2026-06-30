import type { CheckContext, Issue, PageFetcher, Severity } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'
import { isPathDisallowed, parseRobotsTxt, type ParsedRobots } from '../../robots-parser'

interface FetchedRobots {
  statusCode: number
  contentType: string
  text: string
  parsed: ParsedRobots
}

const robotsCache = new WeakMap<PageFetcher, Promise<FetchedRobots>>()

function getRobots(ctx: CheckContext): Promise<FetchedRobots> {
  let pending = robotsCache.get(ctx.fetcher)
  if (!pending) {
    pending = ctx.fetcher.fetch(`${new URL(ctx.site.url).origin}/robots.txt`).then(snap => ({
      statusCode: snap.statusCode,
      contentType: snap.headers['content-type'] ?? '',
      text: snap.html,
      parsed: parseRobotsTxt(snap.html),
    }))
    robotsCache.set(ctx.fetcher, pending)
  }
  return pending
}

function robotsIssue(id: string, severity: Severity, message: string, ctx: CheckContext, suggestion: string): Issue {
  return {
    checkId: id,
    severity,
    message,
    url: `${new URL(ctx.site.url).origin}/robots.txt`,
    suggestion,
    docs: docsUrl(id),
  }
}

function zoneRepresentativePath(pattern: string): string {
  const literal = pattern.split('*')[0]!
  return literal === '' ? '/' : literal
}

export const robotsReachable = defineCheck({
  id: 'robots:reachable',
  category: 'robots',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('robots:reachable'),
  async run(ctx) {
    const robots = await getRobots(ctx)
    if (robots.statusCode !== 200) {
      return [robotsIssue('robots:reachable', 'error', `robots.txt responds with ${robots.statusCode}`, ctx, 'Serve /robots.txt with status 200')]
    }
    if (!robots.contentType.includes('text/plain')) {
      return [robotsIssue('robots:reachable', 'error', `robots.txt content-type is "${robots.contentType}", expected text/plain`, ctx, 'Serve robots.txt as text/plain')]
    }
    return []
  },
})

export const robotsZoneNotBlocked = defineCheck({
  id: 'robots:zone-not-blocked',
  category: 'robots',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('robots:zone-not-blocked'),
  async run(ctx) {
    const robots = await getRobots(ctx)
    if (robots.statusCode !== 200) return []
    const selfPaths = ctx.site.apps?.self?.paths ?? ['/**']
    const issues: Issue[] = []
    for (const pattern of selfPaths) {
      const path = zoneRepresentativePath(pattern)
      if (isPathDisallowed(robots.parsed, path)) {
        issues.push(robotsIssue(
          'robots:zone-not-blocked',
          'error',
          `Own zone path "${path}" (pattern ${pattern}) is disallowed by robots.txt`,
          ctx,
          'Remove the Disallow rule covering your zone or narrow it down',
        ))
      }
    }
    return issues
  },
})

export const robotsSitemapDeclared = defineCheck({
  id: 'robots:sitemap-declared',
  category: 'robots',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('robots:sitemap-declared'),
  async run(ctx) {
    const expected = ctx.site.robots?.expect?.sitemaps ?? []
    if (expected.length === 0) return []
    const robots = await getRobots(ctx)
    if (robots.statusCode !== 200) return []
    return expected
      .filter(url => !robots.parsed.sitemaps.includes(url))
      .map(url => robotsIssue(
        'robots:sitemap-declared',
        'warn',
        `Sitemap "${url}" is not declared in robots.txt`,
        ctx,
        `Add "Sitemap: ${url}" to robots.txt`,
      ))
  },
})

export const robotsEnvPolicy = defineCheck({
  id: 'robots:env-policy',
  category: 'robots',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('robots:env-policy'),
  async run(ctx) {
    const indexable = ctx.site.robots?.expect?.indexable
    if (indexable === undefined) return []
    const robots = await getRobots(ctx)
    if (robots.statusCode !== 200) return []
    const rootBlocked = isPathDisallowed(robots.parsed, '/')
    if (indexable && rootBlocked) {
      return [robotsIssue('robots:env-policy', 'error', 'Production must be indexable but robots.txt disallows /', ctx, 'Open the site: remove "Disallow: /" on production')]
    }
    if (!indexable && !rootBlocked) {
      return [robotsIssue('robots:env-policy', 'error', 'Non-production environment must be closed but robots.txt allows crawling', ctx, 'Close the environment with "User-agent: *\\nDisallow: /"')]
    }
    return []
  },
})

export const robotsExpectedDisallow = defineCheck({
  id: 'robots:expected-disallow',
  category: 'robots',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('robots:expected-disallow'),
  async run(ctx) {
    const expected = ctx.site.robots?.expect?.disallow ?? []
    if (expected.length === 0) return []
    const robots = await getRobots(ctx)
    if (robots.statusCode !== 200) return []
    return expected
      .map(pattern => ({ pattern, path: zoneRepresentativePath(pattern) }))
      .filter(({ path }) => !isPathDisallowed(robots.parsed, path))
      .map(({ pattern, path }) => robotsIssue(
        'robots:expected-disallow',
        'warn',
        `Service path "${path}" (pattern ${pattern}) is expected to be disallowed but is crawlable`,
        ctx,
        `Add "Disallow: ${path}" to robots.txt`,
      ))
  },
})

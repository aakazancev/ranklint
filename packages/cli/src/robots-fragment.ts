import type { RanklintUserConfig } from '@ranklint/core'

export function buildRobotsFragment(config: RanklintUserConfig): string {
  const selfPaths = config.apps?.self?.paths ?? []
  const disallow = config.robots?.expect?.disallow ?? []
  const sitemaps = config.robots?.expect?.sitemaps ?? []
  const lines: string[] = []
  lines.push(`# ranklint fragment for ${config.site.url}${selfPaths.length ? ` (zone: ${selfPaths.join(', ')})` : ''}`)
  lines.push('# add these lines to the root robots.txt owned by the main application')
  if (disallow.length > 0) {
    lines.push('')
    lines.push('User-agent: *')
    for (const pattern of disallow) {
      lines.push(`Disallow: ${pattern.split('*')[0]}`)
    }
  }
  for (const sitemap of sitemaps) {
    lines.push(`Sitemap: ${sitemap}`)
  }
  lines.push('')
  return lines.join('\n')
}

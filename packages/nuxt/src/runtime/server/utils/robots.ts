export function resolveIndexable(envOverride: string | undefined, isDev: boolean): boolean {
  if (envOverride) return envOverride === 'production' || envOverride === 'prod'
  return !isDev
}

export function buildRobotsTxt(opts: { indexable: boolean, sitemapUrl?: string }): string {
  if (!opts.indexable) {
    return 'User-agent: *\nDisallow: /\n'
  }
  const lines = ['User-agent: *', 'Allow: /']
  if (opts.sitemapUrl) lines.push(`Sitemap: ${opts.sitemapUrl}`)
  lines.push('')
  return lines.join('\n')
}

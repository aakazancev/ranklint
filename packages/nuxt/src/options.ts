export interface SitemapSourceEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export interface ModuleOptions {
  site?: { url?: string, name?: string }
  sitemap?: boolean | {
    enabled?: boolean
    path?: string
    sources?: (string | SitemapSourceEntry)[]
    cacheTtl?: number
  }
  robots?: false | { mode?: 'owner' | 'external' }
  jsonLd?: boolean
  devtools?: boolean
}

export interface ResolvedRanklintOptions {
  siteUrl: string
  siteName: string
  sitemap: false | {
    path: string
    urlSources: string[]
    staticEntries: SitemapSourceEntry[]
    cacheTtl: number
    routes: string[]
  }
  robots: false | { mode: 'owner' | 'external' }
  jsonLd: boolean
  devtools: boolean
}

export function resolveRanklintOptions(options: ModuleOptions): ResolvedRanklintOptions {
  const sitemapInput = options.sitemap ?? true
  const sitemapEnabled = sitemapInput !== false
    && (typeof sitemapInput === 'boolean' || sitemapInput.enabled !== false)
  const sitemapObj = typeof sitemapInput === 'object' ? sitemapInput : {}
  const sources = sitemapObj.sources ?? []
  const robotsInput = options.robots ?? { mode: 'owner' as const }

  return {
    siteUrl: options.site?.url?.replace(/\/$/, '') ?? '',
    siteName: options.site?.name ?? '',
    sitemap: sitemapEnabled
      ? {
          path: sitemapObj.path ?? '/sitemap.xml',
          urlSources: sources.filter((s): s is string => typeof s === 'string'),
          staticEntries: sources.filter((s): s is SitemapSourceEntry => typeof s !== 'string'),
          cacheTtl: sitemapObj.cacheTtl ?? 3600,
          routes: [],
        }
      : false,
    robots: robotsInput === false ? false : { mode: robotsInput.mode ?? 'owner' },
    jsonLd: options.jsonLd !== false,
    devtools: options.devtools !== false,
  }
}

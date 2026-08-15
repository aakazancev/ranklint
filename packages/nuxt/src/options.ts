export interface SitemapSourceEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export type SitemapSource = () => SitemapSourceEntry[] | Promise<SitemapSourceEntry[]>

export interface ModuleOptions {
  site?: { url?: string, name?: string }
  sitemap?: boolean | {
    enabled?: boolean
    path?: string
    sources?: (string | SitemapSourceEntry | SitemapSource)[]
    cacheTtl?: number
  }
  robots?: false | { mode?: 'owner' | 'external' }
  jsonLd?: boolean
  devtools?: boolean
}

export interface ResolvedRanklintOptions {
  rootDir: string
  siteUrl: string
  siteName: string
  sitemap: false | {
    path: string
    urlSources: string[]
    staticEntries: SitemapSourceEntry[]
    fnSources: SitemapSource[]
    cacheTtl: number
    routes: string[]
  }
  robots: false | { mode: 'owner' | 'external' }
  jsonLd: boolean
  devtools: boolean
}

export function pageFilesToRoutes(files: string[]): string[] {
  return files
    .filter(file => file.endsWith('.vue') && !file.includes('['))
    .map((file) => {
      const route = `/${file.replace(/\.vue$/, '')}`
      return route === '/index' ? '/' : route.replace(/\/index$/, '')
    })
    .sort()
}

export function resolveRanklintOptions(options: ModuleOptions): ResolvedRanklintOptions {
  const sitemapInput = options.sitemap ?? true
  const sitemapEnabled = sitemapInput !== false
    && (typeof sitemapInput === 'boolean' || sitemapInput.enabled !== false)
  const sitemapObj = typeof sitemapInput === 'object' ? sitemapInput : {}
  const sources = sitemapObj.sources ?? []
  const robotsInput = options.robots ?? { mode: 'owner' as const }

  return {
    rootDir: '',
    siteUrl: options.site?.url?.replace(/\/$/, '') ?? '',
    siteName: options.site?.name ?? '',
    sitemap: sitemapEnabled
      ? {
          path: sitemapObj.path ?? '/sitemap.xml',
          urlSources: sources.filter((s): s is string => typeof s === 'string'),
          staticEntries: sources.filter((s): s is SitemapSourceEntry => typeof s === 'object' && s !== null),
          fnSources: sources.filter((s): s is SitemapSource => typeof s === 'function'),
          cacheTtl: sitemapObj.cacheTtl ?? 3600,
          routes: [],
        }
      : false,
    robots: robotsInput === false ? false : { mode: robotsInput.mode ?? 'owner' },
    jsonLd: options.jsonLd !== false,
    devtools: options.devtools !== false,
  }
}

import type { ResolvedRanklintOptions } from '../../../options'
import { defineEventHandler, setHeader, useRuntimeConfig } from '#imports'
import { buildRobotsTxt, resolveIndexable } from '../utils/robots'

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/plain')
  const config = useRuntimeConfig(event).ranklint as ResolvedRanklintOptions
  const indexable = resolveIndexable(process.env.NUXT_RANKLINT_ENV, import.meta.dev)
  const sitemapUrl = config.sitemap !== false && config.siteUrl
    ? `${config.siteUrl}${config.sitemap.path}`
    : undefined
  return buildRobotsTxt({ indexable, sitemapUrl })
})

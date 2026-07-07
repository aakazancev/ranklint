import type { ResolvedRanklintOptions, SitemapSourceEntry } from '../../../options'
import { defineEventHandler, setHeader, useRuntimeConfig } from '#imports'
import { fnSources } from '#ranklint/sitemap-sources'
import { buildSitemapXml } from '../utils/sitemap'

let cache: { body: string, expires: number } | undefined

export default defineEventHandler(async (event) => {
  setHeader(event, 'content-type', 'application/xml')
  if (cache && cache.expires > Date.now()) return cache.body

  const config = useRuntimeConfig(event).ranklint as ResolvedRanklintOptions
  if (config.sitemap === false) return ''
  const entries: SitemapSourceEntry[] = config.sitemap.routes.map(route => ({ loc: route }))
  entries.push(...config.sitemap.staticEntries)
  for (const source of config.sitemap.urlSources) {
    try {
      const fetched = await $fetch<SitemapSourceEntry[]>(source)
      if (Array.isArray(fetched)) entries.push(...fetched)
    } catch (e) {
      console.warn(`[ranklint] sitemap source "${source}" failed:`, e)
    }
  }
  for (const [i, source] of fnSources.entries()) {
    try {
      entries.push(...await source())
    } catch (e) {
      console.warn(`[ranklint] sitemap function source #${i} failed:`, e)
    }
  }
  const body = buildSitemapXml(config.siteUrl, entries)
  cache = { body, expires: Date.now() + config.sitemap.cacheTtl * 1000 }
  return body
})

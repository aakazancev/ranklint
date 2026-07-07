import { fileURLToPath } from 'node:url'
import { $fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

await setup({
  rootDir: fileURLToPath(new URL('../../../../playground', import.meta.url)),
  build: true,
  server: true,
})

describe('sitemap.xml', () => {
  it('serves xml with static page routes', async () => {
    const xml = await $fetch<string>('/sitemap.xml')
    expect(xml).toContain('<urlset')
    expect(xml).toContain('<loc>http://localhost:3000/</loc>')
    expect(xml).toContain('<loc>http://localhost:3000/bugs/title-short</loc>')
    expect(xml).toContain('<loc>http://localhost:3000/jsonld</loc>')
  })

  it('includes entries from async function sources', async () => {
    const xml = await $fetch<string>('/sitemap.xml')
    expect(xml).toContain('<loc>http://localhost:3000/from-async-source</loc>')
    expect(xml).toContain('<changefreq>weekly</changefreq>')
  })
})

describe('robots.txt', () => {
  it('serves open policy with sitemap directive on production build', async () => {
    const txt = await $fetch<string>('/robots.txt')
    expect(txt).toContain('User-agent: *')
    expect(txt).toContain('Allow: /')
    expect(txt).toContain('Sitemap: http://localhost:3000/sitemap.xml')
  })
})

describe('composables', () => {
  it('useJsonLd renders ld+json script and useRanklintIgnore renders marker', async () => {
    const html = await $fetch<string>('/jsonld')
    expect(html).toContain('application/ld+json')
    expect(html).toContain('"@type":"Product"')
    expect(html).toContain('"name":"Ranklint Test Widget"')
    expect(html).toContain('name="ranklint:ignore"')
    expect(html).toContain('content="meta:description-length"')
  })
})

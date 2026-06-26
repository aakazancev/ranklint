import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { addImports, addServerHandler, createResolver, defineNuxtModule } from '@nuxt/kit'
import { pageFilesToRoutes, resolveRanklintOptions, type ModuleOptions } from './options'

export type { ModuleOptions, ResolvedRanklintOptions, SitemapSourceEntry } from './options'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@ranklint/nuxt',
    configKey: 'ranklint',
    compatibility: { nuxt: '^4.0.0' },
  },
  defaults: {},
  setup(options, nuxt) {
    const compat = nuxt.options.future?.compatibilityVersion
    if (compat !== undefined && compat < 4) {
      throw new Error(
        '[ranklint] Requires Nuxt 4. Set future.compatibilityVersion to 4 or upgrade: https://nuxt.com/docs/getting-started/upgrade',
      )
    }
    const resolved = resolveRanklintOptions(options)
    nuxt.options.runtimeConfig.ranklint = resolved
    const resolver = createResolver(import.meta.url)

    if (resolved.sitemap !== false) {
      const pagesDir = join(nuxt.options.srcDir, 'pages')
      if (existsSync(pagesDir)) {
        const files = readdirSync(pagesDir, { recursive: true, encoding: 'utf8' })
          .map(file => relative('.', file))
        resolved.sitemap.routes = pageFilesToRoutes(files)
      }
      addServerHandler({
        route: resolved.sitemap.path,
        handler: resolver.resolve('./runtime/server/routes/sitemap.xml.get'),
      })
    }

    if (resolved.robots !== false && resolved.robots.mode === 'owner') {
      addServerHandler({
        route: '/robots.txt',
        handler: resolver.resolve('./runtime/server/routes/robots.txt.get'),
      })
    }

    if (resolved.jsonLd) {
      addImports({ name: 'useJsonLd', from: resolver.resolve('./runtime/composables/use-json-ld') })
    }
    addImports({ name: 'useRanklintIgnore', from: resolver.resolve('./runtime/composables/use-ranklint-ignore') })
  },
})

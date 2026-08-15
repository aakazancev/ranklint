import { existsSync, readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { addImports, addServerHandler, createResolver, defineNuxtModule, useLogger } from '@nuxt/kit'
import { pageFilesToRoutes, resolveRanklintOptions, type ModuleOptions } from './options'

export type { ModuleOptions, ResolvedRanklintOptions, SitemapSource, SitemapSourceEntry } from './options'

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
    const logger = useLogger('ranklint')
    const resolved = resolveRanklintOptions(options)
    resolved.rootDir = nuxt.options.rootDir
    const fnSources = resolved.sitemap === false ? [] : resolved.sitemap.fnSources
    if (resolved.sitemap !== false) resolved.sitemap.fnSources = []
    nuxt.options.runtimeConfig.ranklint = resolved
    const resolver = createResolver(import.meta.url)

    const serializedSources = fnSources.map((fn, i) => {
      const code = String(fn)
      try {
        new Function(`return (${code})`)
        return code
      } catch {
        throw new TypeError(
          `[ranklint] sitemap source #${i} cannot be serialized (bound/native functions are not supported); `
          + 'use a plain self-contained function',
        )
      }
    })
    nuxt.hook('nitro:config' as never, ((nitroConfig: { virtual?: Record<string, string> }) => {
      nitroConfig.virtual ??= {}
      nitroConfig.virtual['#ranklint/sitemap-sources']
        = `export const fnSources = [${serializedSources.join(', ')}]`
    }) as never)

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
      const nuxtOptions = nuxt.options as unknown as { nitro?: { prerender?: { routes?: string[] } } }
      nuxtOptions.nitro ??= {}
      nuxtOptions.nitro.prerender ??= {}
      nuxtOptions.nitro.prerender.routes ??= []
      nuxtOptions.nitro.prerender.routes.push(resolved.sitemap.path)
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

    if (resolved.devtools && nuxt.options.dev) {
      const clientDir = join(dirname(fileURLToPath(import.meta.resolve('@ranklint/devtools'))), 'client')
      if (!existsSync(clientDir)) {
        logger.warn('devtools client bundle is not built — the SEO tab is disabled (run `pnpm --filter @ranklint/devtools build`)')
      }
      if (existsSync(clientDir)) {
        addServerHandler({
          route: '/__ranklint/devtools',
          handler: resolver.resolve('./runtime/server/routes/ranklint-devtools.get'),
        })
        addServerHandler({
          route: '/__ranklint/devtools-zones',
          handler: resolver.resolve('./runtime/server/routes/ranklint-devtools-zones.get'),
        })
        const nuxtOptions = nuxt.options as unknown as { nitro?: { publicAssets?: unknown[] } }
        nuxtOptions.nitro ??= {}
        nuxtOptions.nitro.publicAssets ??= []
        nuxtOptions.nitro.publicAssets.push({ dir: clientDir, baseURL: '/__ranklint/devtools-client', maxAge: 0 })
        nuxt.hook('devtools:customTabs' as never, ((tabs: unknown[]) => {
          tabs.push({
            name: 'ranklint',
            title: 'SEO',
            icon: 'carbon:search-locate',
            view: { type: 'iframe', src: '/__ranklint/devtools' },
          })
        }) as never)
      }
    }
  },
})

import { defineNuxtModule } from '@nuxt/kit'
import { resolveRanklintOptions, type ModuleOptions } from './options'

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
  },
})

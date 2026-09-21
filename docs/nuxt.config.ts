import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    '@nuxtjs/i18n',
    '@ranklint/nuxt',
    (_options, nuxt) => {
      nuxt.hook('pages:extend', (pages) => {
        const landing = pages.find(page => page.name === 'index')
        if (landing) landing.path = '/:lang(en|ru)?'
      })
    },
  ],
  css: ['~/og-fonts.css'],
  components: [
    { path: '~/components/landing', pathPrefix: false },
    '~/components',
  ],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
    head: {
      link: [
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },
  vite: {
    $client: {
      resolve: {
        alias: {
          '@ranklint/core': fileURLToPath(new URL('./app/utils/core-shim.ts', import.meta.url)),
        },
      },
    },
  },
  ogImage: {
    zeroRuntime: false,
    fontSubsets: ['latin', 'cyrillic'],
  },
  routeRules: {
    '/': { redirect: '/en' },
  },
  site: {
    name: 'ranklint',
    url: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev',
  },
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  i18n: {
    baseUrl: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev',
    defaultLocale: 'en',
    langDir: 'locales',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'ru', name: 'Русский', language: 'ru-RU', file: 'ru.json' },
    ],
  },
  fonts: {
    families: [
      { name: 'Unbounded', provider: 'google', weights: [600, 700] },
      { name: 'Golos Text', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 500, 600, 700] },
    ],
  },
  ranklint: {
    site: { url: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev', name: 'ranklint' },
    sitemap: false,
    robots: false,
    jsonLd: true,
    devtools: true,
  },
})

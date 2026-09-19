import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  extends: ['docus'],
  modules: [
    '@nuxtjs/i18n',
    '@ranklint/nuxt',
    (_options, nuxt) => {
      nuxt.hook('pages:extend', (pages) => {
        const landing = pages.find(page => page.name === 'lang-index')
        if (landing) landing.path = '/:lang(en|ru)?'
      })
    },
  ],
  css: ['~/og-fonts.css'],
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
  i18n: {
    baseUrl: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'ru', name: 'Русский', language: 'ru-RU' },
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

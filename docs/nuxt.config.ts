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
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
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
    jsonLd: false,
    devtools: true,
  },
})

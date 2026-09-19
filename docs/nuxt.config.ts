export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@nuxtjs/i18n', '@ranklint/nuxt'],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL ?? '/',
  },
  site: {
    name: 'ranklint',
    url: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev',
  },
  i18n: {
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

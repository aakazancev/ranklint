export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  nitro: { prerender: { failOnError: false } },
  ranklint: {
    site: { url: 'http://localhost:3000', name: 'Ranklint Playground' },
    sitemap: {
      sources: [
        async () => [{ loc: '/from-async-source', changefreq: 'weekly' }],
      ],
    },
  },
})

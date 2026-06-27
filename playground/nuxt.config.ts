export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  nitro: { prerender: { failOnError: false } },
  ranklint: {
    site: { url: 'http://localhost:3000', name: 'Ranklint Playground' },
  },
})

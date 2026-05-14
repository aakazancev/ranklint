export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  ranklint: {
    site: { url: 'http://localhost:3000', name: 'Ranklint Playground' },
  },
})

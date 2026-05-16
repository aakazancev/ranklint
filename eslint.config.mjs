import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt().append(
  {
    ignores: ['**/dist/**', '**/.nuxt/**', '**/.output/**'],
  },
  {
    // страницы/лейауты Nuxt легитимно одно-словные (index.vue, app.vue)
    files: ['playground/app/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
)

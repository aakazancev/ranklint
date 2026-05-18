import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt().append(
  {
    ignores: ['**/dist/**', '**/.nuxt/**', '**/.output/**'],
  },
  {
    files: ['playground/app/**/*.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  },
)

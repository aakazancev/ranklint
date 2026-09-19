import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://ranklint.dev' },
  crawl: { maxPages: 300 },
  rules: {
    'meta:og-required': 'warn',
  },
})

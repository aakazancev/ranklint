import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: process.env.NUXT_SITE_URL ?? 'https://ranklint.dev' },
  crawl: { maxPages: 300, entry: ['/en'], ignore: ['/ru/**'] },
  rules: {
    'links:no-orphans': 'off',
  },
})

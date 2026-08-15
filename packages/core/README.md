# @ranklint/core

The [ranklint](https://github.com/aakazancev/ranklint) engine: types, crawler, check runner, `seo.config` loader (c12 + zod), report diff and storages. No Nuxt or Playwright dependencies — page loading is abstracted behind the `PageFetcher` interface.

```ts
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  rules: { 'meta:title-length': ['error', { min: 30, max: 60 }] },
})
```

Full documentation: [aakazancev.github.io/ranklint](https://aakazancev.github.io/ranklint/). MIT.

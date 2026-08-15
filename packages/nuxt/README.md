# Ranklint

> Lint your SEO before Google does.

SEO toolkit for Nuxt 4: sitemap/robots/JSON-LD generation out of the box, an SEO linter in dev via DevTools, and regression control in CI.

- **Runtime** — the module serves `sitemap.xml`, `robots.txt`, and typed JSON-LD by itself
- **Dev** — an "SEO" tab in Nuxt DevTools: heading outline, meta, JSON-LD with validation, page audit
- **CI** — the CLI crawls a deployed site and fails on thresholds; junit/markdown/json reports

## Quick start

### Module

```bash
npx nuxi module add @ranklint/nuxt
```

Works with zero configuration: `/sitemap.xml` (static routes from `app/pages/`) and `/robots.txt` (non-prod environments are closed to indexing) are available right away.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  ranklint: {
    site: { url: 'https://example.com', name: 'Example' },
    sitemap: {
      sources: [
        '/api/seo/urls',
        async () => (await $fetch<string[]>('/api/products')).map(slug => ({ loc: `/p/${slug}` })),
      ],
      cacheTtl: 3600,
    },
    robots: { mode: 'owner' },
    jsonLd: true,
  },
})
```

Every block can be disabled with `false` — disabled code is not registered at all.

A function source is serialized into the server bundle via `toString()`, so it must be self-contained: Nitro globals (`$fetch`) are available, but closures over variables and imports from `nuxt.config` are not.

```vue
<script setup>
useJsonLd('Product', {
  name: 'Widget',
  offers: { price: 9.99, priceCurrency: 'USD' },
})

useRanklintIgnore(['headings:single-h1'])
</script>
```

In dev, JSON-LD is validated against Schema.org schemas (Product, Article, BreadcrumbList, Organization, WebSite) with console warnings; in prod the validator is completely tree-shaken out of the bundle. The module's client runtime is under 1 KB gzip.

### CLI

```bash
npm i -D @ranklint/cli
npx playwright install chromium

ranklint audit --url https://uat.example.com          # audit a live site
ranklint audit --start .output/server/index.mjs        # or self-contained from a build
```

Exit code 1 when errors are found. Reporters: `markdown` (default), `json`, `junit` (`--reporter`, `--output`).

Rules are configured in `ranklint.config.ts` with ESLint semantics:

```ts
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  rules: {
    'meta:title-length': ['error', { min: 30, max: 60 }],
    'meta:description-length': 'off',
  },
  crawl: { concurrency: 5, maxPages: 2000, ignore: ['/admin/**'] },
})
```

### GitLab CI

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/ranklint/ranklint/main/presets/gitlab-ci/seo.yml'

seo:audit:
  extends: .ranklint-audit
  needs: [deploy:uat]
  variables:
    RANKLINT_URL: $CI_ENVIRONMENT_URL
```

`ranklint diff --base main` resolves the base report from CI artifacts: in GitLab — from the branch's job artifact, in GitHub Actions — from the `ranklint-report` artifact (zip extraction is built in). A missing base is not an error: diff degrades to a full report.

## Rules

42 rules across the meta, headings, canonical, links, i18n, structured-data, images, robots, indexability, and http categories — see the full reference in [docs/rules.md](docs/rules.md).

Every rule accepts `'error' | 'warn' | 'off'` or `[severity, options]`. Inline suppression on a page — `useRanklintIgnore([...])`.

For `ranklint.config.json`/`.jsonc` there is a JSON schema with autocompletion — [schemas/ranklint-config.schema.json](schemas/ranklint-config.schema.json). In a TS config, `defineRanklintConfig` provides the same.

Also included: SEO diff between branches (`ranklint diff`), multi-app zones, per-route Lighthouse thresholds, watch mode, production monitoring with alerts (slack/telegram), CrUX and Search Console data, crawl-budget analysis, and custom rules.

## Custom rules

```ts
// ranklint.config.ts
import { defineCheck } from '@ranklint/checks'
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  customChecks: [
    defineCheck({
      id: 'myteam:no-lorem',
      category: 'meta',
      severity: 'warn',
      scope: 'page',
      docs: 'https://wiki.myteam.dev/seo/no-lorem',
      async run(ctx) {
        const text = ctx.document?.body?.textContent ?? ''
        if (!/lorem ipsum/i.test(text)) return []
        return [{
          checkId: 'myteam:no-lorem',
          severity: 'warn',
          message: 'Placeholder text found',
          url: ctx.page!.url,
          suggestion: 'Replace lorem ipsum with real content',
        }]
      },
    }),
  ],
  rules: {
    'myteam:no-lorem': 'error',
  },
})
```

Custom rules are first-class alongside built-ins: configured via `rules`, disabled with `'off'` and `useRanklintIgnore`. The `CheckContext` contract is stable within a major version.

Presets are plugged in via `extends` (native c12): `@ranklint/preset-default` pins all built-in rules at their default severities. Earlier layers take precedence over later ones, and `ranklint.config` itself overrides all layers:

```ts
export default defineRanklintConfig({
  extends: ['./agency-preset.ts', '@ranklint/preset-default'],
  site: { url: 'https://example.com' },
  rules: { 'images:alt-required': 'error' },
})
```

## Packages

| Package | Purpose |
| --- | --- |
| `@ranklint/nuxt` | Nuxt 4 module: sitemap, robots, useJsonLd, DevTools tab |
| `@ranklint/cli` | `ranklint audit` — crawler (Playwright) + checks + reports |
| `@ranklint/core` | Engine: crawler, runner, config (no Nuxt dependencies) |
| `@ranklint/checks` | Rules + Schema.org schemas |
| `@ranklint/reporters` | markdown / junit / json |
| `@ranklint/devtools` | Vue panel for Nuxt DevTools: live checks of the current page |
| `@ranklint/preset-default` | Preset with the built-in rules for `extends` |

Requirements: Nuxt `^4.0.0`, Node.js `>= 20`. MIT license.

# Ranklint

> Lint your SEO before Google does.

Docs: https://ranklint.dev

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

`sitemap: { autoRoutes: false }` drops the automatic routes collected from `app/pages` — use it with explicit `sources` when routes need locale prefixes or manual curation (i18n / multi-app setups).

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

By default the crawl starts from the audited URL itself. With multi-app zones set `crawl.entry` (e.g. `['/en/market']`) so the crawl starts inside your zone — essential with `--start`, where the seed would otherwise be the server root owned by another zone.

### Profiles and one-off Lighthouse

`profiles` are patched over the base config with `--profile <name>` (defu). Keep Lighthouse off in the regular PR audit and enable it in a release profile that runs on tags or manually:

```ts
export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  lighthouse: { enabled: false },
  profiles: {
    uat: { site: { url: 'https://uat.example.com' } },
    release: { lighthouse: { enabled: true, runs: 5, thresholds: { '/**': { performance: 85 } } } },
  },
})
```

```bash
ranklint audit --url https://uat.example.com --profile uat        # every PR, seconds
ranklint lighthouse --url https://example.com --profile release     # after a release
```

In the GitLab preset set `RANKLINT_PROFILE: release` on a job extending `.ranklint-lighthouse` with `rules: [{ if: $CI_COMMIT_TAG }]`; in the GitHub preset pass `lighthouse-profile: release`.

### GitLab CI

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/aakazancev/ranklint/main/presets/gitlab-ci/seo.yml'

seo:audit:
  extends: .ranklint-audit
  needs: [deploy:uat]
  variables:
    RANKLINT_URL: $CI_ENVIRONMENT_URL
```

`ranklint diff --base main` resolves the base report from CI artifacts: in GitLab — from the branch's job artifact, in GitHub Actions — from the `ranklint-report` artifact (zip extraction is built in). A missing base is not an error: diff degrades to a full report.

### Standalone monitor repo (any stack)

The CLI does not depend on Nuxt: a tiny repo with a config and a scheduled job monitors a whole domain, whatever it is built with, and publishes the latest report to Pages.

```
seo-monitor/
  package.json          { "devDependencies": { "ranklint": "^0.5.0" } }
  ranklint.config.ts
  .github/workflows/monitor.yml   or   .gitlab-ci.yml
```

```ts
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  crawl: { maxPages: 2000, ignore: ['/admin/**', '/api/**'] },
  robots: { mode: 'external', expect: { indexable: true, sitemaps: ['https://example.com/sitemap.xml'] } },
  monitor: { storage: 'fs', dir: '.ranklint/reports', keep: 60 },
})
```

GitHub Actions (report at `https://<owner>.github.io/<repo>/`, enable Pages → Source: GitHub Actions once):

```yaml
on:
  schedule: [{ cron: '0 6 * * *' }]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  seo:
    uses: aakazancev/ranklint/.github/workflows/monitor.yml@main
    with: { url: 'https://example.com', pages: true }
    secrets: inherit
```

GitLab CI (report at the project's Pages URL; the job must be named `pages`):

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/aakazancev/ranklint/main/presets/gitlab-ci/seo.yml'

seo:monitor:
  extends: .ranklint-monitor
  variables:
    RANKLINT_URL: https://example.com

pages:
  extends: .ranklint-pages
  needs: [seo:monitor]
```

Add a pipeline schedule (CI/CD → Schedules) — both jobs run only on `schedule`. Monitor mode never fails the pipeline: it diffs against the previous stored report and alerts (Slack/Telegram via `RANKLINT_SLACK_WEBHOOK`, `RANKLINT_TELEGRAM_BOT_TOKEN` + `RANKLINT_TELEGRAM_CHAT_ID`) only on new issues. `--html-output` / `--json-output` write the full report next to the diff; `ranklint history --dir .ranklint/reports` prints the trend. A trend dashboard with charts is planned separately.

## Rules

42 rules across the meta, headings, canonical, links, i18n, structured-data, images, robots, indexability, and http categories — see the full reference at [ranklint.dev/en/rules](https://ranklint.dev/en/rules).

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

A rule package is just a preset: publish an npm package (or keep a local file) whose default export has `customChecks` and `rules`, and plug it in via `extends: ['@myteam/ranklint-rules']`. Rules from every layer are merged; the config itself wins on conflicts.

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
| `ranklint` | Alias of `@ranklint/cli` — `npm i -D ranklint` gives the `ranklint` binary |

Requirements: Nuxt `^4.0.0`, Node.js `>= 20`. MIT license.

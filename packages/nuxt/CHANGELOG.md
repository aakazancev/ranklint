# @ranklint/nuxt

## 1.0.1

### Patch Changes

- Updated dependencies [660be37]
  - @ranklint/checks@1.0.1
  - @ranklint/devtools@1.0.1
  - @ranklint/core@1.0.1

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API for defineCheck and the config, ranklint init, SARIF reporter, sticky PR comments, automated releases

### Patch Changes

- Updated dependencies [1992080]
- Updated dependencies [5809dcb]
- Updated dependencies [0f30951]
- Updated dependencies [5809dcb]
- Updated dependencies [3f5d9fb]
  - @ranklint/checks@1.0.0
  - @ranklint/core@1.0.0
  - @ranklint/devtools@1.0.0

## 0.5.0

### Patch Changes

- Updated dependencies [ce46ae5]
- Updated dependencies [c6d7a17]
- Updated dependencies [454b496]
- Updated dependencies [9d8b74c]
  - @ranklint/core@0.5.0
  - @ranklint/checks@0.5.0
  - @ranklint/devtools@0.5.0

## 0.4.1

### Patch Changes

- @ranklint/checks@0.4.1
- @ranklint/core@0.4.1
- @ranklint/devtools@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [27f2451]
  - @ranklint/core@0.4.0
  - @ranklint/checks@0.4.0
  - @ranklint/devtools@0.4.0

## 0.3.0

### Minor Changes

- Add `sitemap.autoRoutes` option to disable automatic routes collected from `app/pages` (for i18n / multi-app setups where page-file paths do not match public URLs)

### Patch Changes

- Updated dependencies
  - @ranklint/checks@0.3.0
  - @ranklint/devtools@0.3.0
  - @ranklint/core@0.3.0

## 0.2.0

### Minor Changes

- 3f6cd50: Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

### Patch Changes

- Updated dependencies [3f6cd50]
  - @ranklint/core@0.2.0
  - @ranklint/checks@0.2.0
  - @ranklint/devtools@0.2.0

## 0.1.1

### Patch Changes

- Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.
- Updated dependencies
  - @ranklint/core@0.1.1
  - @ranklint/checks@0.1.1
  - @ranklint/devtools@0.1.1

## 0.1.0

### Minor Changes

- b473a8b: Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

### Patch Changes

- Updated dependencies [b473a8b]
  - @ranklint/core@0.1.0
  - @ranklint/checks@0.1.0
  - @ranklint/devtools@0.1.0

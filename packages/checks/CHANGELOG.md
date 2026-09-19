# @ranklint/checks

## 0.5.0

### Minor Changes

- 9d8b74c: `sitemap:reachable` gets a `maxProbes` option (default 100, 0 = unlimited) and reports how many sitemap URLs were left unverified instead of skipping them silently

### Patch Changes

- c6d7a17: Rule `docs` links now point at the documentation site (ranklint.dev) with a page per rule
- 454b496: `meta:og-required` reports all missing og tags in a single issue per page instead of one issue per tag
- Updated dependencies [ce46ae5]
  - @ranklint/core@0.5.0

## 0.4.1

### Patch Changes

- @ranklint/core@0.4.1

## 0.4.0

### Patch Changes

- Updated dependencies [27f2451]
  - @ranklint/core@0.4.0

## 0.3.0

### Minor Changes

- `i18n:no-locale-leak` now detects Arabic-script text (matched against ar/fa/ur locales), alongside Cyrillic and the en/de/fr/es/it stop-word profiles

### Patch Changes

- @ranklint/core@0.3.0

## 0.2.0

### Minor Changes

- 3f6cd50: Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

### Patch Changes

- Updated dependencies [3f6cd50]
  - @ranklint/core@0.2.0

## 0.1.1

### Patch Changes

- Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.
- Updated dependencies
  - @ranklint/core@0.1.1

## 0.1.0

### Minor Changes

- b473a8b: Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

### Patch Changes

- Updated dependencies [b473a8b]
  - @ranklint/core@0.1.0

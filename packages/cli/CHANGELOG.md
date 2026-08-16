# @ranklint/cli

## 0.4.1

### Patch Changes

- 6b7a0e1: `--start` now overrides `site.url` with the launched server origin — zone classification treated every localhost page as external and audited nothing
  - @ranklint/checks@0.4.1
  - @ranklint/core@0.4.1
  - @ranklint/reporters@0.4.1

## 0.4.0

### Minor Changes

- 27f2451: Add `crawl.entry` config option — seed paths for the crawl resolved against the audited URL. Fixes `--start` with multi-app zones, where the implicit server-root seed belongs to a foreign zone and nothing was crawled

### Patch Changes

- Updated dependencies [27f2451]
  - @ranklint/core@0.4.0
  - @ranklint/checks@0.4.0
  - @ranklint/reporters@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies
  - @ranklint/checks@0.3.0
  - @ranklint/core@0.3.0
  - @ranklint/reporters@0.3.0

## 0.2.0

### Minor Changes

- 3f6cd50: Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

### Patch Changes

- Updated dependencies [3f6cd50]
  - @ranklint/core@0.2.0
  - @ranklint/checks@0.2.0
  - @ranklint/reporters@0.2.0

## 0.1.1

### Patch Changes

- Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.
- Updated dependencies
  - @ranklint/core@0.1.1
  - @ranklint/checks@0.1.1
  - @ranklint/reporters@0.1.1

## 0.1.0

### Minor Changes

- b473a8b: Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

### Patch Changes

- Updated dependencies [b473a8b]
  - @ranklint/core@0.1.0
  - @ranklint/checks@0.1.0
  - @ranklint/reporters@0.1.0

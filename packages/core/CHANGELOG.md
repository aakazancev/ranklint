# @ranklint/core

## 1.0.1

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API for defineCheck and the config, ranklint init, SARIF reporter, sticky PR comments, automated releases

## 0.5.0

### Minor Changes

- ce46ae5: Crawl progress: `onPage` callback in core, CLI logs each crawled page to stderr (`[ranklint] 5/30 200 1234ms <url>`). Reachability HEAD requests are now wrapped in the crawl timeout — a hanging HEAD stalled the whole crawl forever

## 0.4.1

## 0.4.0

### Minor Changes

- 27f2451: Add `crawl.entry` config option — seed paths for the crawl resolved against the audited URL. Fixes `--start` with multi-app zones, where the implicit server-root seed belongs to a foreign zone and nothing was crawled

## 0.3.0

## 0.2.0

### Minor Changes

- 3f6cd50: Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

## 0.1.1

### Patch Changes

- Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.

## 0.1.0

### Minor Changes

- b473a8b: Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

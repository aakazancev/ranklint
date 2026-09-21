# @ranklint/reporters

## 1.0.1

### Patch Changes

- @ranklint/core@1.0.1

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API for defineCheck and the config, ranklint init, SARIF reporter, sticky PR comments, automated releases

### Minor Changes

- 0fd9138: Add SARIF reporter for GitHub Code Scanning

### Patch Changes

- 0fd9138: Mark markdown diff output for sticky PR/MR comments
- Updated dependencies [3f5d9fb]
  - @ranklint/core@1.0.0

## 0.5.0

### Minor Changes

- 45fc2e0: markdown and html reports group issues by rule (errors first, biggest groups first) instead of one flat table — OG/meta findings for the same rule are now in one place

### Patch Changes

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

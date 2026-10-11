# @ranklint/reporters

## 1.1.0

### Minor Changes

- e35b41d: New `ranklint dashboard` command and `dashboard()` reporter: a single-file HTML monitoring dashboard for GitLab or GitHub Pages built from the stored monitor reports. It shows the latest run with deltas against the previous one, new and fixed issues by rule with errors first, trends for errors, warnings, Lighthouse scores and CrUX field data, Lighthouse by page and the history of every run with a per-run report in `runs/<date>.html`. An issue explorer groups problems by rule or by page: every page gets a checklist of what to fix with the suggestion and docs link for each rule, the affected elements and a NEW mark, and a "Fix once" block lists issues repeated across a section or the whole site that are fixed in one template. Optional branding with `--logo`, `--brand-name` and `--accent`: your logo top left, one accent color for the whole page and a "powered by ranklint" line in the side panel. A `--run-url` button opens the CI pipeline form. The html reporter (`--reporter html`, `--html-output`) gets the same design: issues grouped by page by default, the explorer with filters and a Web Vitals section with CrUX ratings and a Lighthouse table. Pages embed their data and script and load the brand fonts from Google Fonts, falling back to system fonts offline.

### Patch Changes

- 1f669ea: `links:no-utm-internal` and `images:*` escape `"` and `\` in the attribute value of the issue selector. `markdownDiff`, the monitor dashboard and Slack/Telegram notifications list new and fixed issues by severity (error, warn, info), so errors are not cut off by the item limit.
- Updated dependencies [1f669ea]
- Updated dependencies [41da7b8]
- Updated dependencies [81088bc]
- Updated dependencies [4cab41d]
- Updated dependencies [d1c054c]
  - @ranklint/core@1.1.0

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

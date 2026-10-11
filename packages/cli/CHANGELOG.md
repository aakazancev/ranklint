# @ranklint/cli

## 1.1.1

### Patch Changes

- 8c18713: Audit logs progress for checks and every Lighthouse run so long CI jobs no longer look stuck.
  - @ranklint/checks@1.1.1
  - @ranklint/core@1.1.1
  - @ranklint/reporters@1.1.1

## 1.1.0

### Minor Changes

- e35b41d: New `ranklint dashboard` command and `dashboard()` reporter: a single-file HTML monitoring dashboard for GitLab or GitHub Pages built from the stored monitor reports. It shows the latest run with deltas against the previous one, new and fixed issues by rule with errors first, trends for errors, warnings, Lighthouse scores and CrUX field data, Lighthouse by page and the history of every run with a per-run report in `runs/<date>.html`. An issue explorer groups problems by rule or by page: every page gets a checklist of what to fix with the suggestion and docs link for each rule, the affected elements and a NEW mark, and a "Fix once" block lists issues repeated across a section or the whole site that are fixed in one template. Optional branding with `--logo`, `--brand-name` and `--accent`: your logo top left, one accent color for the whole page and a "powered by ranklint" line in the side panel. A `--run-url` button opens the CI pipeline form. The html reporter (`--reporter html`, `--html-output`) gets the same design: issues grouped by page by default, the explorer with filters and a Web Vitals section with CrUX ratings and a Lighthouse table. Pages embed their data and script and load the brand fonts from Google Fonts, falling back to system fonts offline.
- 4cab41d: Page checks skip 4xx/5xx snapshots, so an HTML 404 behind a broken link no longer raises canonical or duplicate title issues; the broken link itself is still reported by `links:no-broken`. New `crawl.respectRobots` option (default `true`): the crawler loads `<origin>/robots.txt` once and does not crawl links disallowed for `*` or for the group matching `crawl.userAgent`; entry URLs are always crawled and the count is reported as `crawlStats.disallowed` and in the crawl log. The robots.txt parser moved to `@ranklint/core` (`parseRobotsTxt`, `isPathDisallowed`, still re-exported by `@ranklint/checks`) and now supports Google `*` and `$` patterns, percent-encoded and non-ASCII paths and most specific user agent group selection. robots.txt is read from the raw response (`ssrHtml`) so browser-rendered fetchers no longer hide its rules from the crawler and `robots:*` checks. Entry URLs are exempt from robots.txt, `sitemap+sample` samples are not. New `lighthouse.urls` option pins the exact list of paths or URLs measured by Lighthouse in `audit` and the `lighthouse` command; an empty list counts as not set. `images:*` issues for `data:` images use a structural `nth-of-type` selector instead of embedding the data URI.

### Patch Changes

- 41da7b8: The crawler no longer treats a page that redirects to another origin as a page of the site: it is counted in `crawlStats.external`, its links are not crawled and page checks don't run on its HTML. Links of a page redirected inside the site resolve against the final URL, and several URLs redirecting to one final URL give a single snapshot, reported under the final URL. An entry URL redirecting to another origin (`example.com` → `www.example.com`, `http` → `https`) is reported as a `crawl:entry-redirect` error instead of an empty audit. `PageSnapshot` gets an optional `finalUrl`, filled by `HttpFetcher` and `PlaywrightFetcher`. `links:no-broken`, `links:no-redirect-chain`, `links:permanent-redirects`, `links:no-utm-internal`, `links:no-orphans` and `canonical:no-chain` resolve relative URLs against `finalUrl` when it is set.
- Updated dependencies [1f669ea]
- Updated dependencies [41da7b8]
- Updated dependencies [98e44d7]
- Updated dependencies [9172e75]
- Updated dependencies [660be37]
- Updated dependencies [e35b41d]
- Updated dependencies [81088bc]
- Updated dependencies [1f669ea]
- Updated dependencies [4cab41d]
- Updated dependencies [d1c054c]
  - @ranklint/core@1.1.0
  - @ranklint/checks@1.1.0
  - @ranklint/reporters@1.1.0

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API for defineCheck and the config, ranklint init, SARIF reporter, sticky PR comments, automated releases

### Minor Changes

- 35c48a3: Add ranklint init: interactive and non-interactive config wizard with CI snippets and Nuxt detection
- 0fd9138: Add SARIF reporter for GitHub Code Scanning

### Patch Changes

- 18b18bb: audit exits cleanly with multiple crawl entries
- Updated dependencies [1992080]
- Updated dependencies [5809dcb]
- Updated dependencies [0f30951]
- Updated dependencies [0fd9138]
- Updated dependencies [5809dcb]
- Updated dependencies [0fd9138]
- Updated dependencies [3f5d9fb]
  - @ranklint/checks@1.0.0
  - @ranklint/reporters@1.0.0
  - @ranklint/core@1.0.0

## 0.5.0

### Minor Changes

- 1635e68: `ranklint lighthouse --profile <name>` applies a config profile (e.g. a release profile with Lighthouse enabled); the json output now includes the effective lighthouse config. CI presets gained a profile-driven Lighthouse job
- 1d0dc84: `ranklint audit --html-output <file>` writes a self-contained html report in both modes and `--json-output` now works in monitor mode; CI presets gained Pages publishing for scheduled monitors (GitLab `.ranklint-pages`, GitHub `monitor.yml` with `pages: true`)

### Patch Changes

- c53ad60: Docs links of the lighthouse-threshold and links:reachable issues point at the documentation site
- ce46ae5: Crawl progress: `onPage` callback in core, CLI logs each crawled page to stderr (`[ranklint] 5/30 200 1234ms <url>`). Reachability HEAD requests are now wrapped in the crawl timeout — a hanging HEAD stalled the whole crawl forever
- ce46ae5: Page navigation waits for `domcontentloaded` instead of `networkidle`, then settles best-effort (`load` up to 10s, quiet network up to 5s). On pages with long-polling analytics `networkidle` never fired and every page burned the full 30s timeout with statusCode 0
- Updated dependencies [ce46ae5]
- Updated dependencies [c6d7a17]
- Updated dependencies [454b496]
- Updated dependencies [45fc2e0]
- Updated dependencies [9d8b74c]
  - @ranklint/core@0.5.0
  - @ranklint/checks@0.5.0
  - @ranklint/reporters@0.5.0

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

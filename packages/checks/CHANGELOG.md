# @ranklint/checks

## 1.1.2

### Patch Changes

- @ranklint/core@1.1.2

## 1.1.1

### Patch Changes

- @ranklint/core@1.1.1

## 1.1.0

### Minor Changes

- 9172e75: New rule links:no-utm-internal (warn) flags internal links that carry UTM or click-id parameters (utm\_\*, gclid, gbraid, wbraid, fbclid, yclid, msclkid, \_gl, mc_cid, mc_eid)

### Patch Changes

- 41da7b8: The crawler no longer treats a page that redirects to another origin as a page of the site: it is counted in `crawlStats.external`, its links are not crawled and page checks don't run on its HTML. Links of a page redirected inside the site resolve against the final URL, and several URLs redirecting to one final URL give a single snapshot, reported under the final URL. An entry URL redirecting to another origin (`example.com` → `www.example.com`, `http` → `https`) is reported as a `crawl:entry-redirect` error instead of an empty audit. `PageSnapshot` gets an optional `finalUrl`, filled by `HttpFetcher` and `PlaywrightFetcher`. `links:no-broken`, `links:no-redirect-chain`, `links:permanent-redirects`, `links:no-utm-internal`, `links:no-orphans` and `canonical:no-chain` resolve relative URLs against `finalUrl` when it is set.
- 98e44d7: Collapse line breaks and repeated spaces in H1 and title text: `indexability:ssr-content` no longer reports multi-line headings as client-side only, `headings:h1-length` and `meta:title-length` measure the normalized text, and `headings:unique-h1`, `meta:no-duplicate-title` and `meta:no-duplicate-description` group duplicates that differ only in whitespace.
  `http:no-soft-404` matches not-found titles split across lines and shows the normalized title in the message.
- 660be37: i18n:no-locale-leak ignores subtrees whose lang attribute differs from the page language
- 1f669ea: `links:no-utm-internal` and `images:*` escape `"` and `\` in the attribute value of the issue selector. `markdownDiff`, the monitor dashboard and Slack/Telegram notifications list new and fixed issues by severity (error, warn, info), so errors are not cut off by the item limit.
- 4cab41d: Page checks skip 4xx/5xx snapshots, so an HTML 404 behind a broken link no longer raises canonical or duplicate title issues; the broken link itself is still reported by `links:no-broken`. New `crawl.respectRobots` option (default `true`): the crawler loads `<origin>/robots.txt` once and does not crawl links disallowed for `*` or for the group matching `crawl.userAgent`; entry URLs are always crawled and the count is reported as `crawlStats.disallowed` and in the crawl log. The robots.txt parser moved to `@ranklint/core` (`parseRobotsTxt`, `isPathDisallowed`, still re-exported by `@ranklint/checks`) and now supports Google `*` and `$` patterns, percent-encoded and non-ASCII paths and most specific user agent group selection. robots.txt is read from the raw response (`ssrHtml`) so browser-rendered fetchers no longer hide its rules from the crawler and `robots:*` checks. Entry URLs are exempt from robots.txt, `sitemap+sample` samples are not. New `lighthouse.urls` option pins the exact list of paths or URLs measured by Lighthouse in `audit` and the `lighthouse` command; an empty list counts as not set. `images:*` issues for `data:` images use a structural `nth-of-type` selector instead of embedding the data URI.
- d1c054c: `normalizeUrl` strips tracking params (`utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `yclid`, `msclkid`, `_gl`, `mc_cid`, `mc_eid`), so the crawler no longer visits `/a?utm_source=x` as a separate page. `links:no-broken`, `links:no-redirect-chain` and `links:permanent-redirects` check such links once and still report the original href.
- Updated dependencies [1f669ea]
- Updated dependencies [41da7b8]
- Updated dependencies [81088bc]
- Updated dependencies [4cab41d]
- Updated dependencies [d1c054c]
  - @ranklint/core@1.1.0

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API for defineCheck and the config, ranklint init, SARIF reporter, sticky PR comments, automated releases

### Patch Changes

- 1992080: Duplicate title and description checks skip hreflang alternates
- 5809dcb: Use a plain hyphen in length range messages
- 0f30951: Ignore pre and code blocks in the i18n:no-locale-leak text heuristic
- 5809dcb: Add the built-in SoftwareApplication schema to JSON-LD validation
- Updated dependencies [3f5d9fb]
  - @ranklint/core@1.0.0

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

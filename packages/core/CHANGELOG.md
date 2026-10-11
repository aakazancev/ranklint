# @ranklint/core

## 1.1.2

## 1.1.1

## 1.1.0

### Minor Changes

- 1f669ea: Export `isTrackingParam(name)` from `@ranklint/core`: true for `utm_*` and `gclid`, `gbraid`, `wbraid`, `fbclid`, `yclid`, `msclkid`, `_gl`, `mc_cid`, `mc_eid`. `normalizeUrl` and `links:no-utm-internal` share this list.
- 41da7b8: The crawler no longer treats a page that redirects to another origin as a page of the site: it is counted in `crawlStats.external`, its links are not crawled and page checks don't run on its HTML. Links of a page redirected inside the site resolve against the final URL, and several URLs redirecting to one final URL give a single snapshot, reported under the final URL. An entry URL redirecting to another origin (`example.com` → `www.example.com`, `http` → `https`) is reported as a `crawl:entry-redirect` error instead of an empty audit. `PageSnapshot` gets an optional `finalUrl`, filled by `HttpFetcher` and `PlaywrightFetcher`. `links:no-broken`, `links:no-redirect-chain`, `links:permanent-redirects`, `links:no-utm-internal`, `links:no-orphans` and `canonical:no-chain` resolve relative URLs against `finalUrl` when it is set.
- 4cab41d: Page checks skip 4xx/5xx snapshots, so an HTML 404 behind a broken link no longer raises canonical or duplicate title issues; the broken link itself is still reported by `links:no-broken`. New `crawl.respectRobots` option (default `true`): the crawler loads `<origin>/robots.txt` once and does not crawl links disallowed for `*` or for the group matching `crawl.userAgent`; entry URLs are always crawled and the count is reported as `crawlStats.disallowed` and in the crawl log. The robots.txt parser moved to `@ranklint/core` (`parseRobotsTxt`, `isPathDisallowed`, still re-exported by `@ranklint/checks`) and now supports Google `*` and `$` patterns, percent-encoded and non-ASCII paths and most specific user agent group selection. robots.txt is read from the raw response (`ssrHtml`) so browser-rendered fetchers no longer hide its rules from the crawler and `robots:*` checks. Entry URLs are exempt from robots.txt, `sitemap+sample` samples are not. New `lighthouse.urls` option pins the exact list of paths or URLs measured by Lighthouse in `audit` and the `lighthouse` command; an empty list counts as not set. `images:*` issues for `data:` images use a structural `nth-of-type` selector instead of embedding the data URI.

### Patch Changes

- 81088bc: Route patterns ending with `/**` match their prefix as a glob, so `/*/market/**` covers `/en/market` and `/en/market/cars`
- d1c054c: `normalizeUrl` strips tracking params (`utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `yclid`, `msclkid`, `_gl`, `mc_cid`, `mc_eid`), so the crawler no longer visits `/a?utm_source=x` as a separate page. `links:no-broken`, `links:no-redirect-chain` and `links:permanent-redirects` check such links once and still report the original href.

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

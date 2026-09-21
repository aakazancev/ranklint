---
title: All rules
description: 42 built-in rules generated from the check registry.
---

Every rule accepts `error`, `warn`, `info`, `off` or `[severity, options]` in ranklint.config and can be suppressed per page with useRanklintIgnore().

| Rule | Category | Scope | Default severity | Description |
| --- | --- | --- | --- | --- |
| [`canonical:no-chain`](/en/rules/meta/canonical-no-chain) | meta | site | warn | canonical doesn't point to a page with a different canonical |
| [`canonical:required`](/en/rules/meta/canonical-required) | meta | page | error | rel=canonical exists |
| [`canonical:valid`](/en/rules/meta/canonical-valid) | meta | page | error | canonical responds 200 (network) |
| [`headings:h1-length`](/en/rules/headings/headings-h1-length) | headings | page | warn | h1 length; { min, max } |
| [`headings:hierarchy`](/en/rules/headings/headings-hierarchy) | headings | page | warn | no level skips (h2 → h4) |
| [`headings:no-empty`](/en/rules/headings/headings-no-empty) | headings | page | warn | no empty headings |
| [`headings:single-h1`](/en/rules/headings/headings-single-h1) | headings | page | error | exactly one h1 |
| [`headings:unique-h1`](/en/rules/headings/headings-unique-h1) | headings | site | warn | h1s are unique across pages |
| [`hreflang:symmetric`](/en/rules/i18n/hreflang-symmetric) | i18n | site | error | hreflang links are reciprocal |
| [`hreflang:valid-targets`](/en/rules/i18n/hreflang-valid-targets) | i18n | page | error | hreflang targets respond 200 |
| [`http:no-mixed-content`](/en/rules/http/http-no-mixed-content) | http | page | error | no http resources on an https page |
| [`http:no-soft-404`](/en/rules/http/http-no-soft-404) | http | site | error | 404s aren't masked as 200 |
| [`http:ttfb-budget`](/en/rules/http/http-ttfb-budget) | http | site | warn | p75 TTFB per group; { p75, budgets } |
| [`http:x-robots-consistent`](/en/rules/http/http-x-robots-consistent) | http | page | error | X-Robots-Tag doesn't contradict meta robots |
| [`i18n:no-locale-leak`](/en/rules/i18n/i18n-no-locale-leak) | i18n | page | error | content language matches URL locale and html lang; code blocks are ignored |
| [`images:alt-required`](/en/rules/images/images-alt-required) | images | page | warn | content imgs have alt |
| [`images:dimensions-required`](/en/rules/images/images-dimensions-required) | images | page | warn | width/height against CLS |
| [`images:no-lazy-above-fold`](/en/rules/images/images-no-lazy-above-fold) | images | page | warn | no loading=lazy in the viewport; { firstImages } |
| [`indexability:ssr-content`](/en/rules/indexability/indexability-ssr-content) | indexability | page | error | content exists in SSR, not only after hydration; { minRatio } |
| [`jsonld:parseable`](/en/rules/structured-data/jsonld-parseable) | structured-data | page | error | JSON-LD parses |
| [`jsonld:valid-schema`](/en/rules/structured-data/jsonld-valid-schema) | structured-data | page | error | validity against Schema.org schemas; { schemas } — your own |
| [`links:no-broken`](/en/rules/links/links-no-broken) | links | page | error | internal links aren't 4xx/5xx (HEAD, cached per run) |
| [`links:no-orphans`](/en/rules/links/links-no-orphans) | links | site | warn | sitemap pages nobody links to |
| [`links:no-redirect-chain`](/en/rules/links/links-no-redirect-chain) | links | page | warn | redirect chains; { maxHops } |
| [`links:permanent-redirects`](/en/rules/links/links-permanent-redirects) | links | page | warn | 302 where a 301 belongs |
| [`links:trailing-slash-consistent`](/en/rules/links/links-trailing-slash-consistent) | links | site | warn | trailing-slash consistency |
| [`meta:description-length`](/en/rules/meta/meta-description-length) | meta | page | warn | meta description length, 70–160 chars by default; { min, max } |
| [`meta:description-required`](/en/rules/meta/meta-description-required) | meta | page | error | meta description exists |
| [`meta:no-duplicate-description`](/en/rules/meta/meta-no-duplicate-description) | meta | site | error | identical descriptions; mutual hreflang alternates are not counted as duplicates |
| [`meta:no-duplicate-title`](/en/rules/meta/meta-no-duplicate-title) | meta | site | error | identical titles across pages; mutual hreflang alternates are not counted as duplicates |
| [`meta:og-required`](/en/rules/meta/meta-og-required) | meta | page | warn | og:title, og:description, og:image — one issue per page listing the missing tags |
| [`meta:title-length`](/en/rules/meta/meta-title-length) | meta | page | warn | title length, 30–60 chars by default; { min, max } |
| [`meta:title-required`](/en/rules/meta/meta-title-required) | meta | page | error | <title> exists |
| [`meta:twitter-card`](/en/rules/meta/meta-twitter-card) | meta | page | warn | twitter:card is valid |
| [`mobile:viewport`](/en/rules/http/mobile-viewport) | http | page | error | viewport meta exists |
| [`robots:env-policy`](/en/rules/robots/robots-env-policy) | robots | site | error | prod open / non-prod closed |
| [`robots:expected-disallow`](/en/rules/robots/robots-expected-disallow) | robots | site | warn | robots.expect expectations hold |
| [`robots:reachable`](/en/rules/robots/robots-reachable) | robots | site | error | robots.txt responds 200 |
| [`robots:sitemap-declared`](/en/rules/robots/robots-sitemap-declared) | robots | site | warn | Sitemap directive declared |
| [`robots:zone-not-blocked`](/en/rules/robots/robots-zone-not-blocked) | robots | site | error | own zone isn't Disallow'ed |
| [`sitemap:no-noindex`](/en/rules/indexability/sitemap-no-noindex) | indexability | site | error | no noindex pages in the sitemap |
| [`sitemap:reachable`](/en/rules/indexability/sitemap-reachable) | indexability | site | error | every sitemap URL responds < 400 (crawl result or HEAD probe, maxProbes: 100, 0 = unlimited); unverified leftovers are reported |

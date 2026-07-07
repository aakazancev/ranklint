# Ranklint rules reference

Generated from the check registry — 42 rules. Every rule accepts `'error' | 'warn' | 'off'` or `[severity, options]` in `seo.config.ts`, and can be suppressed per page with `useRanklintIgnore()`.

| Rule | Category | Scope | Default | Docs |
| --- | --- | --- | --- | --- |
| `canonical:no-chain` | meta | site | warn | [→](https://ranklint.dev/rules/canonical-no-chain) |
| `canonical:required` | meta | page | error | [→](https://ranklint.dev/rules/canonical-required) |
| `canonical:valid` | meta | page | error | [→](https://ranklint.dev/rules/canonical-valid) |
| `headings:h1-length` | headings | page | warn | [→](https://ranklint.dev/rules/headings-h1-length) |
| `headings:hierarchy` | headings | page | warn | [→](https://ranklint.dev/rules/headings-hierarchy) |
| `headings:no-empty` | headings | page | warn | [→](https://ranklint.dev/rules/headings-no-empty) |
| `headings:single-h1` | headings | page | error | [→](https://ranklint.dev/rules/headings-single-h1) |
| `headings:unique-h1` | headings | site | warn | [→](https://ranklint.dev/rules/headings-unique-h1) |
| `hreflang:symmetric` | i18n | site | error | [→](https://ranklint.dev/rules/hreflang-symmetric) |
| `hreflang:valid-targets` | i18n | page | error | [→](https://ranklint.dev/rules/hreflang-valid-targets) |
| `http:no-mixed-content` | http | page | error | [→](https://ranklint.dev/rules/http-no-mixed-content) |
| `http:no-soft-404` | http | site | error | [→](https://ranklint.dev/rules/http-no-soft-404) |
| `http:ttfb-budget` | http | site | warn | [→](https://ranklint.dev/rules/http-ttfb-budget) |
| `http:x-robots-consistent` | http | page | error | [→](https://ranklint.dev/rules/http-x-robots-consistent) |
| `i18n:no-locale-leak` | i18n | page | error | [→](https://ranklint.dev/rules/i18n-no-locale-leak) |
| `images:alt-required` | images | page | warn | [→](https://ranklint.dev/rules/images-alt-required) |
| `images:dimensions-required` | images | page | warn | [→](https://ranklint.dev/rules/images-dimensions-required) |
| `images:no-lazy-above-fold` | images | page | warn | [→](https://ranklint.dev/rules/images-no-lazy-above-fold) |
| `indexability:ssr-content` | indexability | page | error | [→](https://ranklint.dev/rules/indexability-ssr-content) |
| `jsonld:parseable` | structured-data | page | error | [→](https://ranklint.dev/rules/jsonld-parseable) |
| `jsonld:valid-schema` | structured-data | page | error | [→](https://ranklint.dev/rules/jsonld-valid-schema) |
| `links:no-broken` | links | page | error | [→](https://ranklint.dev/rules/links-no-broken) |
| `links:no-orphans` | links | site | warn | [→](https://ranklint.dev/rules/links-no-orphans) |
| `links:no-redirect-chain` | links | page | warn | [→](https://ranklint.dev/rules/links-no-redirect-chain) |
| `links:permanent-redirects` | links | page | warn | [→](https://ranklint.dev/rules/links-permanent-redirects) |
| `links:trailing-slash-consistent` | links | site | warn | [→](https://ranklint.dev/rules/links-trailing-slash-consistent) |
| `meta:description-length` | meta | page | warn | [→](https://ranklint.dev/rules/meta-description-length) |
| `meta:description-required` | meta | page | error | [→](https://ranklint.dev/rules/meta-description-required) |
| `meta:no-duplicate-description` | meta | site | error | [→](https://ranklint.dev/rules/meta-no-duplicate-description) |
| `meta:no-duplicate-title` | meta | site | error | [→](https://ranklint.dev/rules/meta-no-duplicate-title) |
| `meta:og-required` | meta | page | warn | [→](https://ranklint.dev/rules/meta-og-required) |
| `meta:title-length` | meta | page | warn | [→](https://ranklint.dev/rules/meta-title-length) |
| `meta:title-required` | meta | page | error | [→](https://ranklint.dev/rules/meta-title-required) |
| `meta:twitter-card` | meta | page | warn | [→](https://ranklint.dev/rules/meta-twitter-card) |
| `mobile:viewport` | http | page | error | [→](https://ranklint.dev/rules/mobile-viewport) |
| `robots:env-policy` | robots | site | error | [→](https://ranklint.dev/rules/robots-env-policy) |
| `robots:expected-disallow` | robots | site | warn | [→](https://ranklint.dev/rules/robots-expected-disallow) |
| `robots:reachable` | robots | site | error | [→](https://ranklint.dev/rules/robots-reachable) |
| `robots:sitemap-declared` | robots | site | warn | [→](https://ranklint.dev/rules/robots-sitemap-declared) |
| `robots:zone-not-blocked` | robots | site | error | [→](https://ranklint.dev/rules/robots-zone-not-blocked) |
| `sitemap:no-noindex` | indexability | site | error | [→](https://ranklint.dev/rules/sitemap-no-noindex) |
| `sitemap:reachable` | indexability | site | error | [→](https://ranklint.dev/rules/sitemap-reachable) |

Special rules outside the registry: `links:reachable` (foreign-zone reachability, configurable), `lighthouse:threshold` (from lighthouse config), `crawl:timeout`, `internal:check-failed`.

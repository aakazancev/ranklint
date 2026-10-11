---
title: "ranklint changelog and release notes"
description: "Every ranklint release with breaking changes, features and fixes, newest first, with links to the commits behind them."
---

<!-- generated:start -->

## ranklint 1.1.1

Released: 2026-10-11 · [Release notes](/en/changelog/v1.1.1)

Audit logs progress for checks and every Lighthouse run so long CI jobs no longer look stuck.

## ranklint 1.1.0

Released: 2026-10-11 · [Release notes](/en/changelog/v1.1.0)

ranklint 1.1.0 turns monitor mode into a place to read results. `ranklint dashboard` builds a single-file HTML dashboard from the stored monitor reports, ready for GitLab or GitHub Pages: the latest run with deltas, new and fixed issues with errors first, trends for errors, Lighthouse scores and CrUX field data, a per-run report for every date and an issue explorer that turns each page into a checklist of what to fix. A "Fix once" block lists problems repeated across a section or the whole site, and `--logo`, `--brand-name` and `--accent` put your brand on it. The crawler now respects robots.txt, follows redirects to the final URL, skips pages that redirect off the site and drops tracking parameters when it dedupes URLs; `lighthouse.urls` pins Lighthouse to your key pages, and the new `links:no-utm-internal` rule flags internal links with UTM tags.

## ranklint 1.0.0

Released: 2026-09-21 · [Release notes](/en/changelog/v1.0.0)

ranklint 1.0.0 freezes the public API: `defineCheck`, the config schema and the CLI flags are stable and follow semver from here on. `ranklint init` scaffolds a config and a CI workflow in one command, the SARIF reporter feeds GitHub code scanning, and the diff command leaves one sticky comment per pull request instead of a new one per run. Releases are cut automatically by changesets, so every version on this page maps to a tagged npm publish.

## ranklint 0.5.0

Released: 2026-09-19 · [Release notes](/en/changelog/v0.5.0)

`sitemap:reachable` gets a `maxProbes` option (default 100, 0 = unlimited) and reports how many sitemap URLs were left unverified instead of skipping them silently

## ranklint 0.4.1

Released: 2026-08-16 · [Release notes](/en/changelog/v0.4.1)

`--start` now overrides `site.url` with the launched server origin — zone classification treated every localhost page as external and audited nothing

## ranklint 0.4.0

Released: 2026-08-16 · [Release notes](/en/changelog/v0.4.0)

Add `crawl.entry` config option — seed paths for the crawl resolved against the audited URL. Fixes `--start` with multi-app zones, where the implicit server-root seed belongs to a foreign zone and nothing was crawled

## ranklint 0.3.0

Released: 2026-08-16 · [Release notes](/en/changelog/v0.3.0)

`i18n:no-locale-leak` now detects Arabic-script text (matched against ar/fa/ur locales), alongside Cyrillic and the en/de/fr/es/it stop-word profiles

## ranklint 0.2.0

Released: 2026-08-15 · [Release notes](/en/changelog/v0.2.0)

Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

## ranklint 0.1.1

Released: 2026-08-15 · [Release notes](/en/changelog/v0.1.1)

Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.

## ranklint 0.1.0

Released: 2026-08-15 · [Release notes](/en/changelog/v0.1.0)

Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

<!-- generated:end -->

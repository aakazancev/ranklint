---
title: "Изменения и релизы ranklint"
description: "Все релизы ranklint: ломающие изменения, новое и исправления, от новых к старым, со ссылками на коммиты."
---

<!-- generated:start -->

## ranklint 1.0.0

Дата: 2026-09-21 · [Подробнее](/ru/changelog/v1.0.0)

ranklint 1.0.0 замораживает публичный API: `defineCheck`, схема конфига и флаги CLI стабильны и дальше живут по semver. `ranklint init` одной командой создаёт конфиг и CI-workflow, SARIF-репортер отдаёт результаты в GitHub code scanning, а diff оставляет в pull request один закреплённый комментарий вместо нового на каждый прогон. Релизы собираются changesets автоматически, поэтому каждая версия на этой странице соответствует опубликованному npm-тегу.

## ranklint 0.5.0

Дата: 2026-09-19 · [Подробнее](/ru/changelog/v0.5.0)

::div{lang="en"}

`sitemap:reachable` gets a `maxProbes` option (default 100, 0 = unlimited) and reports how many sitemap URLs were left unverified instead of skipping them silently

::

## ranklint 0.4.1

Дата: 2026-08-16 · [Подробнее](/ru/changelog/v0.4.1)

::div{lang="en"}

`--start` now overrides `site.url` with the launched server origin — zone classification treated every localhost page as external and audited nothing

::

## ranklint 0.4.0

Дата: 2026-08-16 · [Подробнее](/ru/changelog/v0.4.0)

::div{lang="en"}

Add `crawl.entry` config option — seed paths for the crawl resolved against the audited URL. Fixes `--start` with multi-app zones, where the implicit server-root seed belongs to a foreign zone and nothing was crawled

::

## ranklint 0.3.0

Дата: 2026-08-16 · [Подробнее](/ru/changelog/v0.3.0)

::div{lang="en"}

`i18n:no-locale-leak` now detects Arabic-script text (matched against ar/fa/ur locales), alongside Cyrillic and the en/de/fr/es/it stop-word profiles

::

## ranklint 0.2.0

Дата: 2026-08-15 · [Подробнее](/ru/changelog/v0.2.0)

::div{lang="en"}

Config file renamed to `ranklint.config.{ts,js,mjs,json,jsonc}`. The old `seo.config.*` name still works as a deprecated fallback and will be removed in a future release. The JSON schema moved to `schemas/ranklint-config.schema.json`.

::

## ranklint 0.1.1

Дата: 2026-08-15 · [Подробнее](/ru/changelog/v0.1.1)

::div{lang="en"}

Per-package READMEs, npm metadata (description, keywords, repository), the bare `ranklint` alias package for @ranklint/cli.

::

## ranklint 0.1.0

Дата: 2026-08-15 · [Подробнее](/ru/changelog/v0.1.0)

::div{lang="en"}

Initial v0.1 release: Nuxt 4 module (sitemap, robots, useJsonLd, useRanklintIgnore, DevTools tab), crawl engine with zones and crawl-budget analysis, 42 SEO rules, `ranklint` CLI (audit, diff, watch, monitor, lighthouse, outline), markdown/json/junit/gitlab/html reporters, GitLab CI and GitHub Actions presets.

::

<!-- generated:end -->

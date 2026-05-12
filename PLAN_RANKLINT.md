# Ranklint — ТЗ и план разработки

SEO-toolkit для Nuxt 4: генерация из коробки + линтер в dev + регрессионный контроль в CI.

> **Слоган:** «Lint your SEO before Google does».

Этот документ — полное ТЗ для реализации. Работать по релизам сверху вниз (v0.1 → v1.0).

---

## 0. Продукт в одном абзаце

Ranklint закрывает технический SEO для Nuxt 4 проектов на трёх контурах:

- **Runtime/Build** — модуль сам отдаёт `sitemap.xml`, `robots.txt`, типизированный JSON-LD.
- **Dev** — DevTools-таб и watch mode показывают SEO-ошибки, пока разработчик пишет код.
- **CI** — CLI краулит задеплоенный сайт, гоняет чеки, делает SEO Diff между ветками с комментарием в MR, мониторит прод по расписанию.

**Осознанно НЕ входит в скоуп** (не реализовывать): генерация OG-images, AI-генерация контента (meta description, alt-тексты), auto-fix, e-commerce-специфичные чеки (product schema completeness, out-of-stock handling), off-page SEO, контент-аналитика.

**Уникальные фичи** (главные аргументы продукта, не срезать при упрощениях):

- **SEO Diff на MR** — никто на рынке так не делает.
- **Multi-app boundaries** — зоны ответственности под одним доменом.
- **CI-first подход** — пороги, reporters, готовые пресеты.
- **Один пакет вместо пяти** — sitemap + robots + schema + checks + lighthouse.

---

## 1. Название и публикация

- **Имя:** Ranklint. npm scope `@ranklint/*` (проверено 06.07.2026: пакеты `ranklint`, `@ranklint/nuxt` свободны).
- **Первые шаги** (сделать руками до кода): зарегистрировать npm-организацию `ranklint` (бесплатно для public), GitHub org `ranklint`, по возможности домен `ranklint.dev`.
- **Репозиторий:** публичный, монорепа `ranklint/ranklint`. Open-source обязателен — иначе не попасть в каталог модулей nuxt.com и не получить доверие комьюнити.
- **Публикация:** все пакеты public (`npm publish --access public`). Лицензия MIT.
- **Монетизация** (потом, не сейчас): open-core — ядро открыто, платными могут стать хостед-дашборд истории метрик и Search Console-интеграция как SaaS.

---

## 2. Технические требования и ограничения

- Только Nuxt 4 (`peerDependencies: { nuxt: "^4.0.0" }`), Node.js `>= 20`.
- В `defineNuxtModule` указать `meta.compatibility.nuxt: '^4.0.0'`. Дополнительно в `setup` проверять `nuxt.options.future?.compatibilityVersion` — если `< 4`, бросать понятную ошибку с инструкцией.
- Учитывать специфику Nuxt 4: `srcDir = app/` (роуты сканировать в `app/pages/`), `server/` живёт в корне проекта, Unhead 2 (никаких `vmid`/`hid`), split tsconfigs, хук `pages:resolved` (не `pages:extend`) для чтения meta роутов.
- **Бюджет клиентского рантайма: ≤ 5 KB gzip.** Это тест в CI самого пакета — сборка падает, если бандл вырос. Dev-код (валидаторы, DevTools) вырезается через `import.meta.dev` tree-shaking.
- CLI (`@ranklint/cli`) не зависит от Nuxt-контекста: одинаково работает локально и в CI против любого URL.
- **Стек:** pnpm workspaces, `@nuxt/module-builder`, TypeScript strict, Vitest + `@nuxt/test-utils`, Playwright (краулер), unbuild для не-Nuxt пакетов. В CI пакета перед typecheck запускать `nuxt prepare` для playground.

---

## 3. Структура монорепы

```
ranklint/
├── packages/
│   ├── nuxt/          # @ranklint/nuxt — Nuxt 4 модуль (entry point для пользователя)
│   │   ├── src/
│   │   │   ├── module.ts
│   │   │   ├── runtime/
│   │   │   │   ├── composables/        # useJsonLd, useRanklintIgnore
│   │   │   │   └── server/routes/      # sitemap.xml.get.ts, robots.txt.get.ts
│   │   │   ├── build/                  # sitemap из API-источников при сборке
│   │   │   └── devtools/               # регистрация DevTools-таба
│   ├── core/          # @ranklint/core — движок: crawler, runner, snapshot, report, diff
│   ├── checks/        # @ranklint/checks — правила (плагинная система)
│   ├── cli/           # @ranklint/cli — audit / diff / watch / lighthouse / generate
│   ├── reporters/     # @ranklint/reporters — markdown, junit, gitlab-codequality, html, json, slack, telegram
│   └── devtools/      # @ranklint/devtools — UI таба (Vue)
├── presets/
│   ├── gitlab-ci/     # seo.yml для include (job'ы .ranklint-audit, .ranklint-lighthouse, .ranklint-monitor)
│   └── github-actions/
├── playground/        # Nuxt 4 приложение для разработки + фикстуры с намеренными SEO-багами
├── docs/              # сайт документации (nuxt-content)
├── pnpm-workspace.yaml
└── turbo.json         # или nx — задачи build/test/lint
```

Зависимости пользователя:

```json
{
  "dependencies":    { "@ranklint/nuxt": "^x" },
  "devDependencies": { "@ranklint/cli":  "^x" }
}
```

---

## 4. Пакет `@ranklint/core` — движок

Не знает про Nuxt. Абстракции:

```ts
interface PageSnapshot {
  url: string
  html: string              // финальный HTML
  ssrHtml?: string          // HTML до гидрации (для indexability)
  statusCode: number
  headers: Record<string, string>
  ttfb: number
  links: { href: string, text: string, rel?: string }[]
}

interface Check {
  id: string                          // 'meta:title-length'
  category: 'meta' | 'headings' | 'links' | 'i18n' | 'structured-data'
    | 'images' | 'robots' | 'indexability' | 'http'
  severity: 'error' | 'warn' | 'info'
  scope: 'page' | 'site'              // site = кросс-страничный анализ (дубликаты и т.п.)
  run(ctx: CheckContext): Promise<CheckResult>
}

interface Issue {
  checkId: string
  message: string
  url: string
  selector?: string
  suggestion?: string
  docs?: string
}

interface Report {
  meta: { url: string, commit?: string, timestamp: string, pagesAudited: number }
  issues: Issue[]
  lighthouse?: LighthouseResults
  crawlStats: { visited: number, skipped: number, external: number }
}
```

**Краулер (Playwright):**

- Старт: seed-URL и/или sitemap.
- Обход только в пределах `apps.self.paths` (см. multi-app ниже). Ссылки в чужие зоны — очередь reachability (HEAD-запрос), за границу не углубляться. `ignore`-пути — пропуск.
- Настройки: `concurrency`, `delay`, `maxPages`, `strategy: 'full' | 'sitemap+sample'`.
- `sitemap+sample`: все «структурные» страницы + случайная выборка N страниц каждого route-pattern. Для больших каталогов.
- Снимает HTML дважды: ответ сервера (`ssrHtml`) и после гидрации (`html`) — для indexability simulator.

**Runner:** параллельно гоняет page-scope чеки по снапшотам, затем site-scope чеки по всему набору. Агрегирует в `Report`.

**Diff:** сравнение двух `Report` → `{ newIssues, fixedIssues, changed }` + дельты Lighthouse-метрик.

---

## 5. Пакет `@ranklint/checks` — правила

Каждый чек — отдельный файл, регистрируется в реестре. Плагинный API: `defineCheck()` для кастомных правил пользователя (публичный API — v1.0).

### 5.1 Meta

- `meta:title-length` — длина title (default 30–60), настраиваемо
- `meta:title-required` / `meta:description-required` — не пустые
- `meta:description-length` (default 70–160)
- `meta:no-duplicate-title` / `meta:no-duplicate-description` — site-scope, дубли между страницами
- `canonical:required` — canonical присутствует
- `canonical:valid` — абсолютный URL, отвечает 200, не ссылается на редирект/404
- `canonical:self-or-intended` — на страницах пагинации/фильтров canonical соответствует политике

### 5.2 Headings

- `headings:single-h1` — ровно один H1
- `headings:no-empty`
- `headings:hierarchy` — без прыжков уровней (H1→H3 = ошибка)
- `headings:h1-length` (default 20–70)
- `headings:unique-h1` — site-scope, H1 уникален между страницами

### 5.3 Links

- `links:no-broken` — внутренние ссылки не 4xx/5xx
- `links:no-redirect-chain` — максимум N хопов (default 1)
- `links:no-orphans` — site-scope: страница в sitemap, но ни одной внутренней ссылки на неё
- `links:permanent-redirects` — 301 vs 302 (302 не передаёт вес)
- `links:trailing-slash-consistent` — `/page` vs `/page/`

### 5.4 i18n

- `hreflang:symmetric` — если `/en/x` → `/ru/x`, то и обратно; `x-default` присутствует
- `hreflang:valid-targets` — hreflang не ведёт на 404/редирект
- `i18n:no-locale-leak` — `/ru/...` не отдаёт контент/meta другой локали (эвристика: язык title/description vs префикс локали)

### 5.5 Structured data

- `jsonld:parseable` — JSON-LD парсится
- `jsonld:valid-schema` — валидация против Schema.org типов (тот же Zod-набор, что в runtime composable)

### 5.6 Images

- `images:alt-required`
- `images:dimensions-required` — width/height заданы (CLS)
- `images:no-lazy-above-fold` — `loading="lazy"` не на первом экране

### 5.7 HTTP / индексация

- `http:no-soft-404` — страница «не найдено» отдаёт 200 (эвристики: контент-паттерны + сравнение с заведомо несуществующим URL)
- `http:x-robots-consistent` — X-Robots-Tag не конфликтует с meta robots
- `http:ttfb-budget` — перцентили TTFB по route-type в пределах порога
- `indexability:ssr-content` — критичный контент (H1, основной текст) присутствует в `ssrHtml` до гидрации; прогон с UA Googlebot
- `mobile:viewport` — viewport meta присутствует

### 5.8 Robots contract (multi-app)

- `robots:reachable` — корневой `/robots.txt` отвечает 200 и это `text/plain`
- `robots:zone-not-blocked` — пути из `apps.self.paths` не задизаллоулены
- `robots:sitemap-declared` — sitemap своей зоны заявлен директивой `Sitemap:`
- `robots:env-policy` — UAT закрыт (`Disallow: /`), прод открыт (режим — из профиля запуска)
- `robots:expected-disallow` — служебные пути из конфига закрыты

### 5.9 Crawl budget (v1.0)

Анализ параметрических URL (фасеточные фильтры): какие комбинации доступны краулеру, есть ли на них canonical/noindex, оценка «мусорных» URL. Отчёт-рекомендация, не fail.

---

## 6. Пакет `@ranklint/nuxt` — модуль

### 6.1 Sitemap

- Nitro route `server/routes/sitemap.xml` (регистрируется модулем через `addServerHandler`).
- Источники: файловые роуты из `app/pages/` (статические — включаются, динамические `[id].vue` — только через источники) + пользовательские источники: URL API либо async-функция, возвращающая `{ loc, lastmod?, changefreq?, priority? }[]`.
- Кеш через Nitro storage, TTL настраиваемый (default 1h).
- Sitemap-index режим: свой sitemap по пути внутри зоны (напр. `/market/sitemap.xml`) + опционально index, ссылающийся на внешние sitemap'ы.
- Опция build-time генерации в статический файл (для `nuxt generate`).

### 6.2 Robots

- **Режим `owner`** (default): Nitro route `/robots.txt`, контент по окружению — не-prod → `User-agent: *` + `Disallow: /`; prod → allow + `Sitemap`-директива.
- **Режим `external`**: endpoint НЕ регистрируется (robots отдаёт чужое приложение в корне). Вместо генерации — контракт-чеки в CI (см. 5.8) + команда `ranklint generate robots-fragment`, которая выдаёт текст-фрагмент для команды основного сайта (disallow своей служебки + `Sitemap`-директива).

### 6.3 `useJsonLd()`

- Composable с типами Schema.org: минимум Product, Article, BreadcrumbList, Organization, WebSite, FAQPage, LocalBusiness (расширяемо).
- Рендер через Unhead 2 (`useHead({ script: [{ type: 'application/ld+json', innerHTML: ... }] })`).
- В dev — рантайм-валидация Zod с `console.warn`; в prod — только сериализация, валидация tree-shake'ится через `if (import.meta.dev)`.

### 6.4 `useRanklintIgnore()`

Инлайн-отключение правил для конкретной страницы: `useRanklintIgnore(['headings:single-h1'])`. Рендерит meta-маркер `<meta name="ranklint:ignore" content="...">`, который краулер читает и учитывает.

### 6.5 Конфигурация модуля (`nuxt.config.ts`)

```ts
export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  ranklint: {
    site: { url: 'https://example.com', name: 'Example' },
    sitemap: {
      enabled: true,
      path: '/sitemap.xml',
      sources: ['/api/seo/urls'],   // или функции
      cacheTtl: 3600,
    },
    robots: { mode: 'owner' },       // 'owner' | 'external' | false
    jsonLd: true,
    devtools: true,
  }
})
```

Каждый блок независимо отключаем (`false`). Выключено = код не регистрируется вообще (ни endpoint, ни runtime).

### 6.6 DevTools таб «SEO»

Для текущей страницы:

- Outline заголовков H1–H6 деревом, подсветка проблем (прыжки, дубликаты, пустые), клик → скролл к элементу
- Все meta: title, description, canonical, robots, `og:`, `twitter:`, hreflang
- JSON-LD блоки со статусом валидации
- Внутренние ссылки со статусами (лениво, по кнопке «проверить»)
- Кнопка «Запустить аудит страницы» — быстрые чеки Level 1

---

## 7. Пакет `@ranklint/cli`

```sh
ranklint audit   --url <url> | --start [entry]   # полный аудит
ranklint diff    --base <ref|report.json>        # сравнить отчёты
ranklint watch                                   # live-чеки рядом с nuxt dev
ranklint lighthouse --url <url>                  # perf-прогоны (v0.3)
ranklint generate robots-fragment                # фрагмент для чужого robots
ranklint outline --output outlines.md            # экспорт дерева заголовков всех страниц
```

**Два сценария на MR:**

- **A (рекомендуемый):** после деплоя на UAT/preview — `ranklint audit --url $CI_ENVIRONMENT_URL`. Краулится живой сайт, проверяется реальное окружение.
- **B (self-contained):** `ranklint audit --start .output/server/index.mjs` — CLI сам запускает Nitro из сборки, ждёт готовности порта, краулит localhost, гасит процесс. Требует доступ к API с данными из раннера. Не проверяет CDN/nginx.

Дополнительно из `.output` (без запуска): размеры клиентских чанков (перф-подсказки), список роутов (сверка с sitemap).

**Режимы:**

- `default` (MR): exit code по порогам — errors > 0 → 1; warnings — по конфигу.
- `--mode monitor` (прод): не fail; diff с прошлым сохранённым отчётом; алерт только на новые проблемы.

**Хранение отчётов для diff:** отчёт = JSON-артефакт с ключом commit SHA (MR-режим) или timestamp (monitor). Забор base-отчёта: GitLab artifacts API / GitHub artifacts; для monitor — локальная директория/S3-совместимое хранилище (адаптер, конфигом).

**Профили запуска (`seo.config.ts`):**

```ts
profiles: {
  local: { checks: 'fast', lighthouse: false },
  ci:    { checks: 'all', lighthouse: true, diff: { base: 'main' } },
  prod:  { mode: 'monitor', crawl: { strategy: 'sitemap+sample', concurrency: 2, delay: 500 } },
}
```

Один конфиг → одинаковый результат локально и в CI.

---

## 8. `seo.config.ts` — пользовательский конфиг правил

```ts
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://car-market.com' },

  // Multi-app boundaries — зоны ответственности под одним доменом
  apps: {
    self: { paths: ['/market/**'] },                       // полный аудит
    main: { paths: ['/**'], owner: 'external',             // чужое приложение
      checks: ['links:reachable'] },                       // только досягаемость
  },

  robots: {
    mode: 'external',
    expect: {
      allow: ['/market/**'],
      disallow: ['/market/api/**'],
      sitemaps: ['https://car-market.com/market/sitemap.xml'],
    },
  },

  rules: {
    'meta:title-length': ['error', { min: 30, max: 60 }],
    'meta:description-required': 'error',
    'canonical:required': 'error',
    'headings:single-h1': 'error',
    'headings:hierarchy': 'error',
    'links:no-broken': 'error',
    'links:no-redirect-chain': ['warn', { maxHops: 1 }],
    'hreflang:symmetric': 'error',
    'i18n:no-locale-leak': 'error',
    'jsonld:valid-schema': 'error',
    'images:dimensions-required': 'warn',
    'meta:description-length': 'off',        // любое правило отключаемо
  },

  crawl: { concurrency: 5, maxPages: 2000, ignore: ['/admin/**'] },

  lighthouse: {
    runs: 5,
    aggregation: 'median',
    formFactor: 'mobile',                    // mobile-first по умолчанию
    thresholds: {
      '/': { performance: 90, lcp: 2000 },
      '/listing/**': { performance: 80, lcp: 2500 },
    },
  },

  profiles: { /* см. раздел 7 */ },
})
```

Семантика как у ESLint: `'error' | 'warn' | 'off'` или `[severity, options]`. Пресеты: `@ranklint/preset-default` (стартовый набор), архитектура допускает сторонние.

---

## 9. Lighthouse (v0.3)

- Обёртка над npm-пакетом `lighthouse` + `chrome-launcher`.
- N прогонов (default 5), агрегация median (опции p75/best).
- Пороги per-route-pattern (см. конфиг), категории Performance/SEO/Accessibility/Best Practices.
- **LCP element detection:** из LHR вытащить LCP-элемент, определить тип (image/text), для image проверить preload/fetchpriority и выдать конкретный suggestion.
- formFactor mobile по умолчанию (mobile-first индексация), desktop опционально.
- Результаты вливаются в `Report` → участвуют в diff («LCP на `/listing/*` вырос 2.1s → 2.7s»).
- В прод-мониторинге дополнительно CrUX API (бесплатный, ключ Google) — реальные p75 LCP/CLS/INP по origin; в отчёте рядом lab vs field.

---

## 10. Reporters

- `markdown` — комментарий в MR: таблица новых/исправленных ошибок, дельты Lighthouse
- `junit` — XML для CI-артефактов
- `gitlab` — GitLab CodeQuality JSON (inline-аннотации в MR)
- `html` — визуальный отчёт-артефакт
- `json` — сырой `Report` (вход для diff)
- `slack` / `telegram` — нотификаторы для monitor-режима (webhook URL из env)

---

## 11. CI-пресеты

**GitLab (основной, обкатывается первым):**

```yaml
# пользователь подключает:
include:
  - remote: 'https://.../@ranklint/gitlab-ci/seo.yml'

seo:audit:
  extends: .ranklint-audit
  needs: [deploy:uat]
  variables:
    RANKLINT_URL: $CI_ENVIRONMENT_URL
    RANKLINT_DIFF_BASE: main
```

Внутри пресета: кеш Playwright-браузеров, job'ы `.ranklint-audit`, `.ranklint-lighthouse`, `.ranklint-monitor` (rules: schedule). GitHub Actions — зеркальный пресет (v0.3).

**Прод-мониторинг:** scheduled pipeline (ночью), `--mode monitor`, sample-краулинг, полный обход раз в неделю (переменной), алерты только на новые проблемы, robots contract + CrUX.

---

## 12. План релизов

### v0.1 — MVP (~4–6 недель)

- Монорепа: pnpm workspaces, module-builder, playground (Nuxt 4), CI пакета (lint, typecheck c `nuxt prepare`, tests, bundle-size guard ≤5KB)
- **core:** типы, краулер (Playwright, full-стратегия), runner, Report
- **checks:** meta (5.1), headings (5.2), links: no-broken + redirect-chain
- **nuxt:** sitemap (роуты + источники), robots (owner/external), useJsonLd (5 типов схем), useRanklintIgnore
- **cli:** audit `--url`, audit `--start`, reporters markdown + junit + json
- **DevTools таб:** outline + meta + JSON-LD
- GitLab CI пресет (audit job)
- Фикстуры в playground: 10+ страниц с заложенными багами; e2e-тест «audit находит все»
- README + быстрый старт

> **DoD MVP:** `npx nuxi module add @ranklint/nuxt` без конфига отдаёт рабочие sitemap/robots; `ranklint audit` на playground находит все фикстурные баги и выходит с кодом 1; GitLab job проходит end-to-end на реальном проекте; клиентский бандл ≤5KB подтверждён тестом.

### v0.2

- SEO Diff: формат хранения отчётов, забор base из GitLab artifacts, `ranklint diff`, markdown-коммент в MR
- Multi-app boundaries в краулере (зоны, reachability-очередь, стоп на границе)
- Robots contract чеки (5.8) + `generate robots-fragment`
- i18n чеки: hreflang + locale leak
- Site-scope чеки: дубли title/description, unique-h1, orphans
- jsonld-чеки в CI, images-чеки

### v0.3

- Lighthouse (раздел 9) + вливание в diff
- Indexability simulator (ssrHtml vs html, Googlebot UA)
- Watch mode (`ranklint watch`) — быстрые чеки на HMR, вывод в стиле ESLint
- Prod-мониторинг: `--mode monitor`, storage-адаптер отчётов, slack/telegram reporters, CrUX
- HTTP-чеки: soft-404, X-Robots-Tag, trailing slash, 301/302, TTFB, viewport
- GitHub Actions пресет, reporters gitlab-codequality + html
- `sitemap+sample` стратегия краула

### v1.0

- Crawl budget analyzer
- Публичный плагинный API: `defineCheck`, сторонние пресеты
- Search Console интеграция (покрытие индекса, structured data ошибки глазами Google)
- Документация (docs-сайт) + landing, сабмит в nuxt.com/modules

---

## 13. Порядок работ MVP по неделям

| Неделя | Задачи |
| --- | --- |
| **1** | монорепа, конфиги, playground, CI пакета, скелеты пакетов, bundle-size guard |
| **2** | core — типы, краулер, runner; юнит-тесты на фикстурном HTML |
| **3** | 10–12 чеков (meta + headings + links) с тестами; фикстуры-страницы в playground |
| **4** | CLI audit (`--url`, `--start`), reporters markdown/junit/json |
| **5** | модуль — sitemap, robots, useJsonLd; интеграционные тесты через `@nuxt/test-utils` |
| **6** | DevTools таб, GitLab пресет, e2e на реальном проекте, README, релиз v0.1 |

---

## 14. Принципы, которые нельзя нарушать

- **Zero prod impact:** всё, что можно вынести в build/CI — выносим; runtime минимален; dev-код tree-shake'ится. Прозрачность: команда/тест, показывающие вклад в бандл.
- **Всё отключаемо на 4 уровнях:** пакет не установлен → блок в `nuxt.config` → правило в `seo.config` (`'off'`) → инлайн `useRanklintIgnore` на странице. Выключено = не существует, а не «спрятано».
- **Один конфиг — одинаковый результат локально и в CI.** Никаких «локально зелёное, в CI красное».
- **Diff-first для повторяющихся прогонов:** monitor без сравнения с прошлым прогоном бесполезен (алерты замьютят). Алертить только новое.
- **Не выходить за скоуп технического SEO:** контент-качество, ссылочный профиль, семантика запросов — вне продукта.
- **Ошибки — с suggestion и docs-ссылкой.** Каждый Issue объясняет, как починить.

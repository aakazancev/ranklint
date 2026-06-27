# Ranklint

> Lint your SEO before Google does.

SEO-toolkit для Nuxt 4: генерация sitemap/robots/JSON-LD из коробки, SEO-линтер в dev через DevTools и регрессионный контроль в CI.

- **Runtime** — модуль сам отдаёт `sitemap.xml`, `robots.txt`, типизированный JSON-LD
- **Dev** — таб «SEO» в Nuxt DevTools: outline заголовков, meta, JSON-LD с валидацией, аудит страницы
- **CI** — CLI краулит задеплоенный сайт и падает по порогам; junit/markdown/json отчёты

## Быстрый старт

### Модуль

```bash
npx nuxi module add @ranklint/nuxt
```

Работает без конфигурации: `/sitemap.xml` (статические роуты из `app/pages/`) и `/robots.txt` (не-prod окружения закрыты от индексации) доступны сразу.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@ranklint/nuxt'],
  ranklint: {
    site: { url: 'https://example.com', name: 'Example' },
    sitemap: {
      sources: ['/api/seo/urls'],
      cacheTtl: 3600,
    },
    robots: { mode: 'owner' },
    jsonLd: true,
  },
})
```

Каждый блок отключается через `false` — выключенный код не регистрируется вообще.

```vue
<script setup>
useJsonLd('Product', {
  name: 'Widget',
  offers: { price: 9.99, priceCurrency: 'USD' },
})

useRanklintIgnore(['headings:single-h1'])
</script>
```

В dev JSON-LD валидируется против Schema.org-схем (Product, Article, BreadcrumbList, Organization, WebSite) с предупреждениями в консоли; в prod валидатор полностью вырезается из бандла. Клиентский рантайм модуля — меньше 1 KB gzip.

### CLI

```bash
npm i -D @ranklint/cli
npx playwright install chromium

ranklint audit --url https://uat.example.com          # аудит живого сайта
ranklint audit --start .output/server/index.mjs        # или self-contained из сборки
```

Exit code 1, если найдены ошибки. Reporters: `markdown` (default), `json`, `junit` (`--reporter`, `--output`).

Правила настраиваются в `seo.config.ts` с семантикой ESLint:

```ts
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  rules: {
    'meta:title-length': ['error', { min: 30, max: 60 }],
    'meta:description-length': 'off',
  },
  crawl: { concurrency: 5, maxPages: 2000, ignore: ['/admin/**'] },
})
```

### GitLab CI

```yaml
include:
  - remote: 'https://raw.githubusercontent.com/ranklint/ranklint/main/presets/gitlab-ci/seo.yml'

seo:audit:
  extends: .ranklint-audit
  needs: [deploy:uat]
  variables:
    RANKLINT_URL: $CI_ENVIRONMENT_URL
```

## Правила v0.1

| Правило | Default | Что проверяет |
| --- | --- | --- |
| `meta:title-required` | error | `<title>` присутствует и не пуст |
| `meta:title-length` | warn | длина title 30–60 |
| `meta:description-required` | error | meta description присутствует |
| `meta:description-length` | warn | длина description 70–160 |
| `canonical:required` | error | canonical присутствует |
| `canonical:valid` | error | абсолютный URL, отвечает 200, не редирект |
| `headings:single-h1` | error | ровно один H1 |
| `headings:no-empty` | warn | нет пустых заголовков |
| `headings:hierarchy` | warn | без прыжков уровней (H1→H3) |
| `headings:h1-length` | warn | длина H1 20–70 |
| `links:no-broken` | error | внутренние ссылки не 4xx/5xx |
| `links:no-redirect-chain` | warn | максимум 1 редирект-хоп |

Любое правило: `'error' | 'warn' | 'off'` или `[severity, options]`. Инлайн-отключение на странице — `useRanklintIgnore([...])`.

## Пакеты

| Пакет | Назначение |
| --- | --- |
| `@ranklint/nuxt` | Nuxt 4 модуль: sitemap, robots, useJsonLd, DevTools-таб |
| `@ranklint/cli` | `ranklint audit` — краулер (Playwright) + чеки + отчёты |
| `@ranklint/core` | Движок: crawler, runner, config (без Nuxt-зависимостей) |
| `@ranklint/checks` | Правила + Schema.org-схемы |
| `@ranklint/reporters` | markdown / junit / json |

Требования: Nuxt `^4.0.0`, Node.js `>= 20`. Лицензия MIT.

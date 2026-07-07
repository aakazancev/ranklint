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
      sources: [
        '/api/seo/urls',
        async () => (await $fetch<string[]>('/api/products')).map(slug => ({ loc: `/p/${slug}` })),
      ],
      cacheTtl: 3600,
    },
    robots: { mode: 'owner' },
    jsonLd: true,
  },
})
```

Каждый блок отключается через `false` — выключенный код не регистрируется вообще.

Источник-функция сериализуется в серверный бандл через `toString()`, поэтому должна быть самодостаточной: Nitro-глобалы (`$fetch`) доступны, а замыкания на переменные и импорты из `nuxt.config` — нет.

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

`ranklint diff --base main` резолвит базовый отчёт из артефактов CI: в GitLab — по job-артефакту ветки, в GitHub Actions — по артефакту `ranklint-report` (распаковка zip встроена). Base не найден — не ошибка: diff деградирует в полный отчёт.

## Правила

42 правила в категориях meta, headings, canonical, links, i18n, structured-data, images, robots, indexability, http — полный справочник в [docs/rules.md](docs/rules.md).

Любое правило: `'error' | 'warn' | 'off'` или `[severity, options]`. Инлайн-отключение на странице — `useRanklintIgnore([...])`.

Для `seo.config.json`/`.jsonc` есть JSON-схема с автодополнением — [schemas/seo-config.schema.json](schemas/seo-config.schema.json). В TS-конфиге то же даёт `defineRanklintConfig`.

Дополнительно: SEO Diff между ветками (`ranklint diff`), multi-app зоны, Lighthouse-пороги per-route, watch mode, прод-мониторинг с алертами (slack/telegram), CrUX и Search Console данные, crawl-budget анализ, кастомные правила.

## Кастомные правила

```ts
// seo.config.ts
import { defineCheck } from '@ranklint/checks'
import { defineRanklintConfig } from '@ranklint/core'

export default defineRanklintConfig({
  site: { url: 'https://example.com' },
  customChecks: [
    defineCheck({
      id: 'myteam:no-lorem',
      category: 'meta',
      severity: 'warn',
      scope: 'page',
      docs: 'https://wiki.myteam.dev/seo/no-lorem',
      async run(ctx) {
        const text = ctx.document?.body?.textContent ?? ''
        if (!/lorem ipsum/i.test(text)) return []
        return [{
          checkId: 'myteam:no-lorem',
          severity: 'warn',
          message: 'Placeholder text found',
          url: ctx.page!.url,
          suggestion: 'Replace lorem ipsum with real content',
        }]
      },
    }),
  ],
  rules: {
    'myteam:no-lorem': 'error',
  },
})
```

Кастомные правила равноправны со встроенными: настраиваются через `rules`, отключаются `'off'` и `useRanklintIgnore`. Контракт `CheckContext` стабилен в рамках мажорной версии.

Пресеты подключаются через `extends` (нативно c12): `@ranklint/preset-default` фиксирует все встроенные правила на дефолтных severity. Ранние слои приоритетнее поздних, сам `seo.config` переопределяет все слои:

```ts
export default defineRanklintConfig({
  extends: ['./agency-preset.ts', '@ranklint/preset-default'],
  site: { url: 'https://example.com' },
  rules: { 'images:alt-required': 'error' },
})
```

## Пакеты

| Пакет | Назначение |
| --- | --- |
| `@ranklint/nuxt` | Nuxt 4 модуль: sitemap, robots, useJsonLd, DevTools-таб |
| `@ranklint/cli` | `ranklint audit` — краулер (Playwright) + чеки + отчёты |
| `@ranklint/core` | Движок: crawler, runner, config (без Nuxt-зависимостей) |
| `@ranklint/checks` | Правила + Schema.org-схемы |
| `@ranklint/reporters` | markdown / junit / json |
| `@ranklint/devtools` | Vue-панель для Nuxt DevTools: live-чеки текущей страницы |
| `@ranklint/preset-default` | Пресет со встроенными правилами для `extends` |

Требования: Nuxt `^4.0.0`, Node.js `>= 20`. Лицензия MIT.

---
title: Все правила
description: 42 built-in rules generated from the check registry.
---

Каждое правило принимает `error`, `warn`, `info`, `off` или `[severity, options]` в ranklint.config и отключается на странице через useRanklintIgnore().

| Rule | Категория | Область | Severity по умолчанию | Описание |
| --- | --- | --- | --- | --- |
| [`canonical:no-chain`](/ru/rules/meta/canonical-no-chain) | meta | site | warn | canonical не ведёт на страницу с другим canonical |
| [`canonical:required`](/ru/rules/meta/canonical-required) | meta | page | error | есть rel=canonical |
| [`canonical:valid`](/ru/rules/meta/canonical-valid) | meta | page | error | canonical отвечает 200 (сетевой) |
| [`headings:h1-length`](/ru/rules/headings/headings-h1-length) | headings | page | warn | длина h1; { min, max } |
| [`headings:hierarchy`](/ru/rules/headings/headings-hierarchy) | headings | page | warn | без перескоков уровней (h2 → h4) |
| [`headings:no-empty`](/ru/rules/headings/headings-no-empty) | headings | page | warn | нет пустых заголовков |
| [`headings:single-h1`](/ru/rules/headings/headings-single-h1) | headings | page | error | ровно один h1 |
| [`headings:unique-h1`](/ru/rules/headings/headings-unique-h1) | headings | site | warn | h1 уникальны между страницами |
| [`hreflang:symmetric`](/ru/rules/i18n/hreflang-symmetric) | i18n | site | error | взаимность hreflang-ссылок |
| [`hreflang:valid-targets`](/ru/rules/i18n/hreflang-valid-targets) | i18n | page | error | hreflang-цели отвечают 200 |
| [`http:no-mixed-content`](/ru/rules/http/http-no-mixed-content) | http | page | error | нет http-ресурсов на https-странице |
| [`http:no-soft-404`](/ru/rules/http/http-no-soft-404) | http | site | error | 404 не маскируются под 200 |
| [`http:ttfb-budget`](/ru/rules/http/http-ttfb-budget) | http | site | warn | p75 TTFB по группам; { p75, budgets } |
| [`http:x-robots-consistent`](/ru/rules/http/http-x-robots-consistent) | http | page | error | X-Robots-Tag не противоречит meta robots |
| [`i18n:no-locale-leak`](/ru/rules/i18n/i18n-no-locale-leak) | i18n | page | error | язык контента соответствует локали URL и html lang |
| [`images:alt-required`](/ru/rules/images/images-alt-required) | images | page | warn | у контентных img есть alt |
| [`images:dimensions-required`](/ru/rules/images/images-dimensions-required) | images | page | warn | width/height против CLS |
| [`images:no-lazy-above-fold`](/ru/rules/images/images-no-lazy-above-fold) | images | page | warn | нет loading=lazy во вьюпорте; { firstImages } |
| [`indexability:ssr-content`](/ru/rules/indexability/indexability-ssr-content) | indexability | page | error | контент есть в SSR, а не только после гидрации; { minRatio } |
| [`jsonld:parseable`](/ru/rules/structured-data/jsonld-parseable) | structured-data | page | error | JSON-LD парсится |
| [`jsonld:valid-schema`](/ru/rules/structured-data/jsonld-valid-schema) | structured-data | page | error | валидность по Schema.org-схемам; { schemas } — свои схемы |
| [`links:no-broken`](/ru/rules/links/links-no-broken) | links | page | error | внутренние ссылки не 4xx/5xx (HEAD с кешем на прогон) |
| [`links:no-orphans`](/ru/rules/links/links-no-orphans) | links | site | warn | страницы sitemap, на которые никто не ссылается |
| [`links:no-redirect-chain`](/ru/rules/links/links-no-redirect-chain) | links | page | warn | цепочки редиректов; { maxHops } |
| [`links:permanent-redirects`](/ru/rules/links/links-permanent-redirects) | links | page | warn | 302 там, где должен быть 301 |
| [`links:trailing-slash-consistent`](/ru/rules/links/links-trailing-slash-consistent) | links | site | warn | единообразие завершающего слеша |
| [`meta:description-length`](/ru/rules/meta/meta-description-length) | meta | page | warn | длина meta description, по умолчанию 70–160 символов; { min, max } |
| [`meta:description-required`](/ru/rules/meta/meta-description-required) | meta | page | error | есть meta description |
| [`meta:no-duplicate-description`](/ru/rules/meta/meta-no-duplicate-description) | meta | site | error | одинаковые description |
| [`meta:no-duplicate-title`](/ru/rules/meta/meta-no-duplicate-title) | meta | site | error | одинаковые title на разных страницах |
| [`meta:og-required`](/ru/rules/meta/meta-og-required) | meta | page | warn | og:title, og:description, og:image — один issue на страницу со списком отсутствующих |
| [`meta:title-length`](/ru/rules/meta/meta-title-length) | meta | page | warn | длина title, по умолчанию 30–60 символов; { min, max } |
| [`meta:title-required`](/ru/rules/meta/meta-title-required) | meta | page | error | есть <title> |
| [`meta:twitter-card`](/ru/rules/meta/meta-twitter-card) | meta | page | warn | twitter:card корректен |
| [`mobile:viewport`](/ru/rules/http/mobile-viewport) | http | page | error | есть viewport meta |
| [`robots:env-policy`](/ru/rules/robots/robots-env-policy) | robots | site | error | prod открыт / не-prod закрыт |
| [`robots:expected-disallow`](/ru/rules/robots/robots-expected-disallow) | robots | site | warn | ожидания из robots.expect выполняются |
| [`robots:reachable`](/ru/rules/robots/robots-reachable) | robots | site | error | robots.txt отвечает 200 |
| [`robots:sitemap-declared`](/ru/rules/robots/robots-sitemap-declared) | robots | site | warn | Sitemap-директива объявлена |
| [`robots:zone-not-blocked`](/ru/rules/robots/robots-zone-not-blocked) | robots | site | error | своя зона не закрыта Disallow |
| [`sitemap:no-noindex`](/ru/rules/indexability/sitemap-no-noindex) | indexability | site | error | в sitemap нет noindex-страниц |
| [`sitemap:reachable`](/ru/rules/indexability/sitemap-reachable) | indexability | site | error | каждый URL из sitemap отвечает < 400 (из краула или HEAD-пробой, maxProbes: 100, 0 = без лимита); непроверенный остаток попадает в отчёт |

---
seo:
  title: ranklint — SEO-линтер для Nuxt и любого сайта
  description: Sitemap, robots и JSON-LD из коробки, SEO-линтер в DevTools и контроль регрессий в CI.
---

::u-page-hero
#title
Проверь SEO раньше, чем Google

#description
Nuxt 4 модуль для sitemap, robots и JSON-LD, SEO-таб в DevTools и CLI, который краулит любой сайт и роняет CI на регрессиях.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /ru/getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Начать
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/aakazancev/ranklint
  target: _blank
  variant: outline
  ---
  GitHub
  :::
::

::u-page-section
#title
Что внутри

#features
  :::u-page-feature
  ---
  icon: i-lucide-package
  to: /ru/module/overview
  ---
  #title
  Nuxt-модуль без конфига

  #description
  sitemap.xml, robots.txt и типизированный JSON-LD отдаёт модуль; любой блок отключается.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-search-check
  to: /ru/rules
  ---
  #title
  42 встроенных правила

  #description
  Meta, заголовки, canonical, ссылки, i18n, структурированные данные, картинки, robots, индексируемость, http.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-terminal
  to: /ru/cli/audit
  ---
  #title
  CLI для любого стека

  #description
  Краул задеплоенного сайта через Playwright, diff с базовой веткой, мониторинг прода по расписанию.
  :::
::

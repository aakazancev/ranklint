---
seo:
  title: ranklint — SEO linter for Nuxt and any site
  description: Sitemap, robots and JSON-LD out of the box, an SEO linter in DevTools, and regression control in CI.
---

::u-page-hero
#title
Lint your SEO before Google does

#description
A Nuxt 4 module for sitemap, robots and JSON-LD, an SEO tab in DevTools, and a CLI that crawls any site and fails CI on regressions.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /en/getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
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
What you get

#features
  :::u-page-feature
  ---
  icon: i-lucide-package
  to: /en/module/overview
  ---
  #title
  Zero-config Nuxt module

  #description
  sitemap.xml, robots.txt and typed JSON-LD served by the module; every block can be switched off.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-search-check
  to: /en/rules
  ---
  #title
  42 built-in rules

  #description
  Meta, headings, canonical, links, i18n, structured data, images, robots, indexability, http.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-terminal
  to: /en/cli/audit
  ---
  #title
  CLI for any stack

  #description
  Crawl a deployed site with Playwright, diff against the base branch, monitor production on a schedule.
  :::
::

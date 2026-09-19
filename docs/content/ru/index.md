---
seo:
  title: SEO-линтер для Nuxt и CI
  description: "Nuxt-модуль для sitemap, robots и JSON-LD, SEO-таб в DevTools и CLI, который краулит любой сайт и роняет пайплайн на SEO-регрессиях."
---

::landing-hero
---
demo:
  inputLabel: HTML страницы
  emptyLabel: Пока пусто, линтеру нужна разметка страницы.
  cleanLabel: 0 проблем, можно релизить.
  errorLabel: Этот ввод не разобрался как HTML.
  foundLabel: "Найдено проблем: {count}"
  moreLabel: "ещё {count}"
  footnote: "{count} из {total} правил работают прямо здесь, в браузере. CLI запускает все."
---
#title
Проверь SEO *раньше*, чем Google

#description
Nuxt-модуль, таб в DevTools и краулер для CI, который роняет пайплайн на SEO-регрессиях. Любой стек.

#actions
  :::u-button
  ---
  class: landing-cta
  color: primary
  size: lg
  to: /ru/getting-started/installation
  ---
  Начать
  :::

  :::u-button
  ---
  class: landing-cta
  color: neutral
  size: lg
  to: /ru/rules
  variant: outline
  ---
  Все правила
  :::
::

::landing-install
---
copy-label: Скопировать команду
copied-label: Команда скопирована
items:
  - label: Nuxt-модуль
    command: npx nuxi module add @ranklint/nuxt
    note: Отдаёт sitemap.xml, robots.txt и типизированный JSON-LD, открывает SEO-таб в DevTools.
  - label: CLI
    command: npx ranklint audit --url https://example.com
    note: Обходит сайт, печатает отчёт и выходит с кодом 1, если есть ошибки.
---
::

::landing-logos
#note
ranklint линтит вывод любого генератора, включая [Nuxt SEO](/ru/module/overview), и работает рядом с ним.
::

::landing-devtools
---
image-light: /landing/devtools-light.png
image-dark: /landing/devtools-dark.png
image-alt: Таб ranklint в Nuxt DevTools с найденными SEO-проблемами, структурой заголовков и мета-тегами открытой страницы
image-width: 1880
image-height: 1106
mobile-light: /landing/devtools-issues-light.png
mobile-dark: /landing/devtools-issues-dark.png
mobile-width: 912
mobile-height: 634
---
#title
SEO-таб, который открыт всё время разработки

#description
Каждая страница на дев-сервере проверяется на месте. Проблемы, структура заголовков и мета-теги текущего маршрута, а ещё `ranklint watch` в терминале, если привычнее там. Подробнее про [панель DevTools](/ru/module/devtools).
::

::landing-rules
---
count-label: "{count}"
all-label: Справочник правил
---
#title
правила, включены сразу

#description
У каждого правила есть id, severity и страница с объяснением, зачем оно нужно. В ranklint.config оно ставится в error, warn, info или off, как в ESLint, либо глушится на одной странице.
::

::landing-report
---
comment-title: "ranklint · report"
caption: Реальный вывод ranklint diff для демо-приложения из этого репозитория.
---
#title
Решает код возврата, а не совещание

#description
`ranklint audit` пишет JSON-отчёт, `ranklint diff` сравнивает его с базовой веткой. Пайплайн падает только на новых ошибках, поэтому старое предупреждение не блокирует релиз. Репортеры: markdown, json, junit, html, gitlab, github. Подробнее: [diff и CI](/ru/cli/diff-and-ci).

#output
  :::div
  ## Ranklint SEO Diff

  **6 new issues (3 errors) · 0 fixed**

  ### 🔴 New issues

  | Severity | Check | URL | Message |
  | --- | --- | --- | --- |
  | error | `meta:description-required` | `http://localhost:3000/bugs/description-missing` | Page has no meta description |
  | error | `meta:title-required` | `http://localhost:3000/bugs/title-missing` | Page has no &lt;title&gt; |
  | error | `headings:single-h1` | `http://localhost:3000/bugs/h1-multiple` | Page has 2 &lt;h1&gt; elements, expected exactly 1 |
  | warn | `images:alt-required` | `http://localhost:3000/bugs/images-bad` | Image has no alt attribute |
  | warn | `images:dimensions-required` | `http://localhost:3000/bugs/images-bad` | Image has no explicit width/height |
  | warn | `images:no-lazy-above-fold` | `http://localhost:3000/bugs/images-bad` | Image in the viewport uses loading="lazy" |

  ### Pages

  Added: `/bugs/description-missing`, `/bugs/h1-multiple`, `/bugs/images-bad`, `/bugs/title-missing`
  :::
::

::landing-bento
---
stack-title: Аудит любого сайта, не только Nuxt
runtime-title: Рутинные файлы отдаёт модуль
dev-title: Видно, где ломается структура
report-image: /landing/report.png
report-image-alt: HTML-отчёт ranklint с 24 проверенными страницами, ошибки и предупреждения сгруппированы по правилам
report-image-width: 1520
report-image-height: 680
dev-image-light: /landing/devtools-outline-light.png
dev-image-dark: /landing/devtools-outline-dark.png
dev-image-alt: Структура заголовков в табе ranklint, сломанный уровень заголовка отмечен как ошибка
dev-image-width: 784
dev-image-height: 218
---
#title
Рантайм, dev-инструменты и CI в одном тулките

#stack
- Краулер на Playwright обходит живой сайт, а `--start` поднимает сборку и гасит её после прогона. Подробности: [ranklint audit](/ru/cli/audit).
- [Зоны](/ru/cli/zones) делят один домен между несколькими приложениями, у каждого свои правила.
- Lighthouse запускается по профилю, поэтому медленные проверки идут на релизе, а не на каждом коммите.
- Конфиг читается как ESLint, а [кастомные правила](/ru/advanced/custom-rules) пишутся одним `defineCheck`.

#runtime
sitemap.xml, robots.txt и JSON-LD с валидацией по Schema.org. Любой блок отключается, а выключенное не регистрируется. Клиентский рантайм остаётся меньше 1 KB gzip.

#dev
Заголовок, который прыгает с h1 на h3, подсвечивается как ошибка рядом со структурой, прямо на странице, которую вы правите.
::

::landing-timeline
---
steps:
  - label: Установка
    text: Модуль в приложение, CLI в devDependencies.
  - label: Аудит каждого PR
    text: Код возврата решает diff против базовой ветки.
  - label: Мониторинг прода
    text: Прогон по расписанию сравнивает прод с последним сохранённым отчётом.
facts:
  - title: Полевые данные
    text: LCP, CLS и INP из датасета CrUX попадают в тот же отчёт.
  - title: Search Console
    text: URL Inspection показывает, что Google проиндексировал на самом деле.
  - title: Алерты
    text: Slack и Telegram срабатывают на новые проблемы, а не на весь бэклог.
  - title: История
    text: Отчёты уезжают на GitHub или GitLab Pages, ranklint history показывает тренд.
---
#title
Мониторинг SEO прода по расписанию

#description
Задача по крону краулит прод, сохраняет отчёт и алертит, когда что-то ухудшилось с прошлого прогона.

#actions
  :::u-button
  ---
  class: landing-cta
  color: neutral
  to: /ru/cli/monitor
  trailing-icon: i-lucide-arrow-right
  variant: outline
  ---
  Как устроен мониторинг
  :::
::

::landing-faq
---
faq-title: Вопросы
items:
  - label: Чем это отличается от Lighthouse?
    content: Lighthouse оценивает по одной странице за раз и выдаёт число. ranklint краулит весь сайт, возвращает проблемы с селектором и подсказкой и роняет сборку на тех, что помечены как ошибки. При этом он умеет запускать Lighthouse сам, на релизных профилях.
    to: /ru/cli/lighthouse
    linkLabel: Lighthouse в ranklint
  - label: Чем это отличается от Nuxt SEO?
    content: Nuxt SEO генерирует мета-теги, карты сайта и структурированные данные. ranklint проверяет результат, кто бы его ни сделал. Они работают вместе, а модуль отдаёт только то, что ещё не закрыто.
    to: /ru/module/overview
    linkLabel: Что отдаёт модуль
  - label: Работает ли без Nuxt?
    content: Да. CLI обходит по HTTP любой задеплоенный сайт через Playwright, так что WordPress, Astro, Next или статическая папка подходят одинаково. Nuxt-модуль это опциональное удобство.
    to: /ru/cli/audit
    linkLabel: ranklint audit
  - label: Как не ломать пайплайн этим аудитом?
    content: Запустить audit на базовой ветке, сохранить JSON-отчёт, а потом сравнить с ним пул-реквест. Код 1 возвращают только новые ошибки, поэтому накопленный бэклог не блокирует мердж.
    to: /ru/cli/diff-and-ci
    linkLabel: Diff и CI
  - label: Как отключить правило для одной страницы?
    content: Вызвать useRanklintIgnore с нужными id правил внутри страницы. Для всего сайта правило ставится в off в ranklint.config, ровно как в ESLint.
    to: /ru/module/composables
    linkLabel: useRanklintIgnore
  - label: Сколько это стоит?
    content: Нисколько. ranklint под лицензией MIT, работает на своих машинах и никуда ничего не отправляет, пока канал алертов не настроен вручную.
    to: /ru/getting-started/introduction
    linkLabel: Введение
  - label: Нужен ли Playwright?
    content: Для полного краула да, потому что поисковики видят отрендеренный HTML. Правила, которым хватает разметки, работают без браузера, именно на них устроено демо в шапке и таб в DevTools.
    to: /ru/advanced/env
    linkLabel: Env-переменные
---
## Что такое SEO-линтер

SEO-линтер читает HTML, который сайт реально отдаёт, и показывает то, что стоит трафика: пропавший title, canonical, ведущий на редирект, заголовок, который прыгает с h1 на h3, одностороннюю пару hreflang. Идея та же, что у ESLint, только применённая к разметке, которую читают поисковики, а не к JavaScript, который уезжает в прод. На выходе не оценка от 0 до 100, а список конкретных проблем: правило, адрес страницы, селектор и подсказка, что с этим делать.

### SEO-аудит в CI, а не в таблице

Обычно SEO-работа умирает в таблице. Краулер запускают раз в квартал, выгружают список из 400 проблем, и список гниёт, пока сайт продолжает выкатываться. Линтер переворачивает порядок: краул идёт на каждом пул-реквесте, отчёт превращается в diff, и смотреть нужно только на то, что изменилось с последней зелёной сборки. ranklint сохраняет JSON-отчёт как артефакт сборки, сравнивает с ним текущий прогон и публикует разницу комментарием. Набор правил и их severity лежат в репозитории рядом с кодом, поэтому изменение требований к SEO проходит то же ревью, что и любой другой коммит. [Как связаны audit и diff](/ru/cli/diff-and-ci).

### Регресс-тесты SEO на каждый пул-реквест

SEO-регрессии редко выглядят драматично. Рефакторинг убирает canonical из одного шаблона, миграция CMS оставляет 40 страниц без описания, эксперимент добавляет noindex, и его забывают снять. Такие правки проходят код-ревью, потому что в браузере ничего не сломано. Краул, который идёт вместе с тестами, ловит их в тот же час. Severity задаётся на каждое правило, поэтому длина title может остаться предупреждением, пока пропавший canonical останавливает мердж. [Настройка правил и severity](/ru/config/reference).

> Решение принимает код возврата, а не человек.

### Nuxt SEO модуль без конфига

В приложении на Nuxt 4 модуль закрывает всё, что относится к рутине. Он отдаёт sitemap.xml из маршрутов приложения, robots.txt, который различает стейджинг и прод, и JSON-LD с валидацией по Schema.org прямо во время разработки, так что сломанный блок Product или FAQPage виден как предупреждение в консоли, а не как тихая потеря расширенных сниппетов. Каждый блок отключается, а отключённый блок не регистрируется и ничего не стоит в рантайме. Композаблы подключаются только там, где они нужны: useJsonLd для структурированных данных страницы, useRanklintIgnore для точечного отключения правил. [Обзор модуля](/ru/module/overview).

### Любой стек: краул задеплоенного сайта

Краулер говорит по HTTP и ничего не знает про внутренности фреймворка. Достаточно указать URL: каждая страница рендерится в Chromium, поэтому клиентский контент оценивается так же, как его оценивает поисковик, а страницы, которые существуют только после гидрации, попадают в отчёт как проблема индексации. Один домен делится на зоны, когда под разными путями живут разные приложения, а профили держат медленные проверки в стороне от быстрого пайплайна. Отчёт выгружается в markdown, json, junit, html или комментарий в GitLab и GitHub, поэтому результат читается там, где команда уже работает. [Начать с CLI](/ru/cli/audit).
::

::landing-cta
#title
Начать линтить за минуту

#description
Поставить модуль, прогнать один аудит и дать следующему пул-реквесту рассказать, что он сломал.

#actions
  :::u-button
  ---
  class: landing-cta
  color: primary
  size: lg
  to: /ru/getting-started/installation
  ---
  Начать
  :::

  :::u-button
  ---
  class: landing-cta
  color: neutral
  icon: i-simple-icons-github
  size: lg
  target: _blank
  to: https://github.com/aakazancev/ranklint
  variant: ghost
  ---
  GitHub
  :::
::

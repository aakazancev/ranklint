---
seo:
  title: SEO linter for Nuxt and CI
  description: "Nuxt 4 module for sitemap, robots and JSON-LD, an SEO tab in DevTools and a CLI that crawls any site and fails CI on SEO regressions."
---

::landing-hero
---
demo:
  inputLabel: Page HTML
  emptyLabel: Paste the HTML of a page to see what the linter finds.
  cleanLabel: 0 issues, ship it.
  errorLabel: This input could not be parsed as HTML.
  foundLabel: "{count} issues found"
  moreLabel: "{count} more"
  footnote: "{count} of {total} rules run right here in the browser. The CLI runs all of them."
---
#title
Lint your SEO *before* Google does

#description
A Nuxt module, a DevTools tab and a CI crawler that fails the pipeline on SEO regressions. Any stack.

#actions
  :::u-button
  ---
  class: landing-cta
  color: primary
  size: lg
  to: /en/getting-started/installation
  ---
  Get started
  :::

  :::u-button
  ---
  class: landing-cta
  color: neutral
  size: lg
  to: /en/rules
  variant: outline
  ---
  Browse the rules
  :::
::

::landing-install
---
copy-label: Copy the command
copied-label: Command copied
items:
  - label: Nuxt module
    command: npx nuxi module add @ranklint/nuxt
    note: Serves sitemap.xml, robots.txt and typed JSON-LD, and opens the SEO tab in DevTools.
  - label: CLI
    command: npx ranklint audit --url https://example.com
    note: Crawls the site, prints a report and exits with code 1 on errors.
---
::

::landing-logos
#note
ranklint lints the output of any generator, including [Nuxt SEO](/en/module/overview), and works next to it.
::

::landing-devtools
---
image-light: /landing/devtools-light.png
image-dark: /landing/devtools-dark.png
image-alt: The ranklint tab in Nuxt DevTools, showing the SEO issues, the heading outline and the meta tags of the page you are looking at
image-width: 1880
image-height: 1106
mobile-light: /landing/devtools-issues-light.png
mobile-dark: /landing/devtools-issues-dark.png
mobile-width: 912
mobile-height: 634
---
#title
The SEO tab you keep open while you code

#description
Every page you open in the dev server is checked in place. Issues, the heading outline and the meta tags of the current route, plus `ranklint watch` in the terminal when you prefer to stay there. Read about the [DevTools panel](/en/module/devtools).
::

::landing-rules
---
count-label: "{count}"
all-label: Read the rule reference
---
#title
rules, on by default

#description
Every rule is an id, a severity and a page that explains why it matters. Set it to error, warn, info or off in ranklint.config the way you would in ESLint, or silence it on a single page.
::

::landing-report
---
comment-title: "ranklint · report"
caption: Real output of ranklint diff for the demo app in this repository.
---
#title
The exit code decides, not a meeting

#description
`ranklint audit` writes a JSON report, `ranklint diff` compares it with the base branch. The pipeline fails on new errors only, so an old warning never blocks a release. Reporters: markdown, json, junit, html, gitlab, github. See [diff and CI](/en/cli/diff-and-ci).

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
stack-title: Audit any site, not only Nuxt
runtime-title: Serve the boring files
dev-title: See the outline break
report-image: /landing/report.png
report-image-alt: The ranklint HTML report with 24 pages audited, errors and warnings grouped by rule
report-image-width: 1520
report-image-height: 680
dev-image-light: /landing/devtools-outline-light.png
dev-image-dark: /landing/devtools-outline-dark.png
dev-image-alt: The heading outline in the ranklint DevTools tab with a broken heading level marked as an error
dev-image-width: 784
dev-image-height: 218
---
#title
Runtime, dev tools and CI in one toolkit

#stack
- A Playwright crawler walks a live site, or `--start` boots your build and stops it after the run. See [ranklint audit](/en/cli/audit).
- [Zones](/en/cli/zones) split one domain between several apps, each with its own rules.
- Lighthouse runs by profile, so the slow checks happen on release, not on every commit.
- The config reads like ESLint, and [custom rules](/en/advanced/custom-rules) are one `defineCheck` away.

#runtime
sitemap.xml, robots.txt and JSON-LD validated against Schema.org. Every block can be switched off, and what is off is never registered. The client runtime stays under 1 KB gzip.

#dev
A heading level that jumps from h1 to h3 shows up as an error next to the outline, on the page you are editing.
::

::landing-timeline
---
steps:
  - label: Install
    text: The module in the app, the CLI in devDependencies.
  - label: Audit every PR
    text: The diff against the base branch decides the exit code.
  - label: Monitor prod
    text: A scheduled run compares production with the last stored report.
facts:
  - title: Field data
    text: LCP, CLS and INP from the CrUX dataset land in the same report.
  - title: Search Console
    text: URL Inspection tells you what Google actually indexed.
  - title: Alerts
    text: Slack and Telegram fire on new issues, not on the whole backlog.
  - title: History
    text: Reports go to GitHub or GitLab Pages, ranklint history shows the trend.
---
#title
Monitor production SEO on a schedule

#description
A cron job crawls production, stores the report and alerts you when something regressed since the previous run.

#actions
  :::u-button
  ---
  class: landing-cta
  color: neutral
  to: /en/cli/monitor
  trailing-icon: i-lucide-arrow-right
  variant: outline
  ---
  How monitoring works
  :::
::

::landing-faq
---
faq-title: Questions
items:
  - label: How is this different from Lighthouse?
    content: Lighthouse scores one page at a time and gives you a number. ranklint crawls the whole site, returns issues with a selector and a suggestion, and fails the build on the ones you marked as errors. It can still run Lighthouse for you on release profiles.
    to: /en/cli/lighthouse
    linkLabel: Lighthouse in ranklint
  - label: How is this different from Nuxt SEO?
    content: Nuxt SEO generates meta tags, sitemaps and structured data. ranklint checks the result, whoever produced it. The two work together, and the module only serves what you did not already cover.
    to: /en/module/overview
    linkLabel: What the module serves
  - label: Does it work without Nuxt?
    content: Yes. The CLI crawls any deployed site over HTTP with Playwright, so WordPress, Astro, Next or a static folder are all fair game. The Nuxt module is optional sugar.
    to: /en/cli/audit
    linkLabel: ranklint audit
  - label: How do I keep it from breaking the pipeline?
    content: Run audit on the base branch, store the JSON report, then diff the pull request against it. Only new errors return exit code 1, so an existing backlog never blocks a merge.
    to: /en/cli/diff-and-ci
    linkLabel: Diff and CI
  - label: How do I turn a rule off for one page?
    content: Call useRanklintIgnore with the rule ids inside the page. For the whole site, set the rule to off in ranklint.config, the same way you would in ESLint.
    to: /en/module/composables
    linkLabel: useRanklintIgnore
  - label: What does it cost?
    content: Nothing. ranklint is MIT licensed, runs on your machines and sends nothing anywhere unless you configure an alert channel yourself.
    to: /en/getting-started/introduction
    linkLabel: Introduction
  - label: Do I need Playwright?
    content: For a full crawl, yes, because rendered HTML is what search engines see. The rules that only need markup run without a browser, which is what the demo in the hero and the DevTools tab use.
    to: /en/advanced/env
    linkLabel: Environment
---
## What is an SEO linter

An SEO linter reads the HTML your site actually returns and reports the things that cost you traffic: a missing title, a canonical pointing at a redirect, a heading level that jumps from h1 to h3, a hreflang pair that only links one way. It is the same idea as ESLint, applied to the markup search engines read instead of the JavaScript you ship.

### SEO audit in CI, not in a spreadsheet

Most SEO work dies in a spreadsheet. Someone runs a crawler once a quarter, exports a list of 400 issues, and the list rots while the site keeps shipping. A linter inverts that: the crawl runs on every pull request, the report is a diff, and the only thing you have to look at is what changed since the last green build. ranklint stores the JSON report as a build artifact, compares the current run against it and posts the difference as a comment. [See how audit and diff fit together](/en/cli/diff-and-ci).

### SEO regression testing on every pull request

Regressions are rarely dramatic. A refactor drops the canonical from one template, a CMS migration leaves 40 pages without a description, an experiment adds noindex and nobody removes it. Those changes pass code review because nothing looks broken in the browser. A crawl that runs with your tests catches them in the same hour they were introduced. Severity is per rule, so title length can stay a warning while a missing canonical stops the merge. [Configure rules and severities](/en/config/reference).

> The exit code makes the decision instead of a person.

### Nuxt SEO module with zero config

In a Nuxt 4 app the module covers the parts that are pure plumbing. It serves sitemap.xml from your routes, robots.txt that knows the difference between staging and production, and JSON-LD that is validated against Schema.org while you develop, so a broken Product or FAQPage block shows up as a console warning instead of a silent loss of rich results. Each block is opt out, and a disabled block is never registered, so it costs nothing at runtime. [Read the module overview](/en/module/overview).

### Any stack: crawl a deployed site

The crawler talks HTTP, not framework internals. Point it at a URL and it renders each page in Chromium, which means client rendered content is judged the way a search engine judges it, and pages that only exist after hydration are reported as an indexing problem. One domain can be split into zones when different apps live under different paths, and profiles keep the slow checks off the fast pipeline. [Start with the CLI](/en/cli/audit).
::

::landing-cta
#title
Start linting in a minute

#description
Install the module, run one audit, and let the next pull request tell you what it broke.

#actions
  :::u-button
  ---
  class: landing-cta
  color: primary
  size: lg
  to: /en/getting-started/installation
  ---
  Get started
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

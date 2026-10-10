---
"@ranklint/core": minor
"@ranklint/checks": patch
"@ranklint/cli": minor
---

Page checks skip 4xx/5xx snapshots, so an HTML 404 behind a broken link no longer raises canonical or duplicate title issues; the broken link itself is still reported by `links:no-broken`. New `crawl.respectRobots` option (default `true`): the crawler loads `<origin>/robots.txt` once and does not crawl links disallowed for `*` or for the group matching `crawl.userAgent`; entry URLs are always crawled and the count is reported as `crawlStats.disallowed` and in the crawl log. The robots.txt parser moved to `@ranklint/core` (`parseRobotsTxt`, `isPathDisallowed`, still re-exported by `@ranklint/checks`) and now supports Google `*` and `$` patterns, percent-encoded and non-ASCII paths and most specific user agent group selection. robots.txt is read from the raw response (`ssrHtml`) so browser-rendered fetchers no longer hide its rules from the crawler and `robots:*` checks. Entry URLs are exempt from robots.txt, `sitemap+sample` samples are not. New `lighthouse.urls` option pins the exact list of paths or URLs measured by Lighthouse in `audit` and the `lighthouse` command; an empty list counts as not set. `images:*` issues for `data:` images use a structural `nth-of-type` selector instead of embedding the data URI.

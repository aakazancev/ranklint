---
"@ranklint/core": minor
"@ranklint/cli": patch
"@ranklint/checks": patch
---

The crawler no longer treats a page that redirects to another origin as a page of the site: it is counted in `crawlStats.external`, its links are not crawled and page checks don't run on its HTML. Links of a page redirected inside the site resolve against the final URL, and several URLs redirecting to one final URL give a single snapshot, reported under the final URL. An entry URL redirecting to another origin (`example.com` → `www.example.com`, `http` → `https`) is reported as a `crawl:entry-redirect` error instead of an empty audit. `PageSnapshot` gets an optional `finalUrl`, filled by `HttpFetcher` and `PlaywrightFetcher`. `links:no-broken`, `links:no-redirect-chain`, `links:permanent-redirects`, `links:no-utm-internal`, `links:no-orphans` and `canonical:no-chain` resolve relative URLs against `finalUrl` when it is set.

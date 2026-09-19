---
title: "sitemap:reachable"
description: "every sitemap URL responds < 400 (crawl result or HEAD probe, maxProbes: 100, 0 = unlimited); unverified leftovers are reported"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| indexability | site | error |

every sitemap URL responds < 400 (crawl result or HEAD probe, maxProbes: 100, 0 = unlimited); unverified leftovers are reported

### Options

| Option | Type | Description |
| --- | --- | --- |
| `maxProbes` | integer |  |
<!-- generated:end -->

## Why it matters

A sitemap full of dead URLs is treated as a low-quality signal: crawlers spend budget on pages that answer 404 or 5xx instead of the live ones. URLs that were not crawled are verified with HEAD probes, up to 100 by default.

## How to fix

Remove or fix the URLs reported as unreachable and regenerate the sitemap from real routes. When the sitemap is larger than the probe budget, raise `'sitemap:reachable': ['error', { maxProbes }]` (0 = unlimited) or increase `crawl.maxPages`.

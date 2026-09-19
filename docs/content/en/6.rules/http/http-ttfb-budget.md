---
title: "http:ttfb-budget"
description: "p75 TTFB per group; { p75, budgets }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| http | site | warn |

p75 TTFB per group; { p75, budgets }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `p75` | number |  |
| `budgets` | object |  |
<!-- generated:end -->

## Why it matters

Slow time to first byte delays everything that follows, from LCP to crawl throughput. The rule groups crawled pages by route pattern and compares the p75 of each group with a budget of 800 ms.

## How to fix

Look at server rendering time and caching for the route group in the message, starting with uncached data fetching on that route. Set per-route budgets with `'http:ttfb-budget': ['warn', { p75, budgets }]`, where `budgets` maps a route pattern to milliseconds.

---
title: "links:no-redirect-chain"
description: "redirect chains; { maxHops }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| links | page | warn |

redirect chains; { maxHops }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `maxHops` | integer |  |
<!-- generated:end -->

## Why it matters

Every hop on an internal link costs a round trip for users and crawl budget for search engines, and link signals fade along the chain. By default the rule allows one hop and reports anything longer.

## How to fix

Point the link at the final URL instead of the redirecting one: fix trailing slashes, old paths and http/https mixes at the source. If a hop is intentional, raise the limit with `'links:no-redirect-chain': ['warn', { maxHops }]`.

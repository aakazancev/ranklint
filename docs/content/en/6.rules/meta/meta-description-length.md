---
title: "meta:description-length"
description: "length; { min, max }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| meta | page | warn |

length; { min, max }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `min` | integer |  |
| `max` | integer |  |
<!-- generated:end -->

## Why it matters

Meta description is the text under the title in search results. Below 70 characters it wastes the snippet, above 160 characters search engines truncate the rest.

## How to fix

Rewrite the description into one or two sentences that describe the page and fit the window. Override the bounds with `'meta:description-length': ['warn', { min, max }]` when your snippets are localized or intentionally short.

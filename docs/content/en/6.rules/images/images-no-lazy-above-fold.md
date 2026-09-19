---
title: "images:no-lazy-above-fold"
description: "no loading=lazy in the viewport; { firstImages }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| images | page | warn |

no loading=lazy in the viewport; { firstImages }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `firstImages` | integer |  |
<!-- generated:end -->

## Why it matters

A `loading="lazy"` image inside the first screen is fetched only after layout, which delays LCP directly. Without viewport data from the browser the rule inspects the first three images of the document.

## How to fix

Drop `loading="lazy"` from above-the-fold images and load them eagerly, keeping lazy loading for everything below. Change how many leading images are inspected with `'images:no-lazy-above-fold': ['warn', { firstImages }]`.

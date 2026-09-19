---
title: "indexability:ssr-content"
description: "content exists in SSR, not only after hydration; { minRatio }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| indexability | page | error |

content exists in SSR, not only after hydration; { minRatio }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `minRatio` | number |  |
<!-- generated:end -->

## Why it matters

Crawlers that do not execute JavaScript index the server response, so content that appears only after hydration is invisible to them. The rule compares SSR HTML with the hydrated page and expects at least half of the text to be server-rendered.

## How to fix

Move the H1 and the main content out of client-only components so they are present in the server response. For pages where a client-rendered part is unavoidable, tune the threshold with `'indexability:ssr-content': ['error', { minRatio }]`.

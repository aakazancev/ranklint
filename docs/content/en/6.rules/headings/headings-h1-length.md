---
title: "headings:h1-length"
description: "h1 length; { min, max }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| headings | page | warn |

h1 length; { min, max }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `min` | integer |  |
| `max` | integer |  |
<!-- generated:end -->

## Why it matters

H1 tells both the reader and the crawler what the page is about. A one-word H1 carries no context, and a 100-character H1 usually means a sentence was put where a heading belongs.

## How to fix

Keep the H1 between 20 and 70 characters: expand a bare word into a descriptive phrase, or move the extra wording into the lead paragraph. Adjust with `'headings:h1-length': ['warn', { min, max }]`.

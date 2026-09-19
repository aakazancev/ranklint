---
title: "meta:title-length"
description: "title length, 30–60 chars by default; { min, max }"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| meta | page | warn |

title length, 30–60 chars by default; { min, max }

### Options

| Option | Type | Description |
| --- | --- | --- |
| `min` | integer |  |
| `max` | integer |  |
<!-- generated:end -->

## Why it matters

The `<title>` is the headline of the SERP snippet. A title shorter than 30 characters rarely says what the page is about, and anything past 60 characters gets truncated mid-phrase in most results.

## How to fix

Expand a short title with the page topic and brand, or trim a long one so the meaningful part comes first. If your language or layout needs another window, set `'meta:title-length': ['warn', { min, max }]` in ranklint.config.

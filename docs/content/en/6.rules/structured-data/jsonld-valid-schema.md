---
title: "jsonld:valid-schema"
description: "validity against Schema.org schemas; { schemas } — your own"
---

<!-- generated:start -->
| Category | Scope | Default severity |
| --- | --- | --- |
| structured-data | page | error |

validity against Schema.org schemas; { schemas } — your own

### Options

| Option | Type | Description |
| --- | --- | --- |
| `schemas` | any |  |
<!-- generated:end -->

## Why it matters

Rich results are granted only when the JSON-LD node carries the fields schema.org marks as required for its type. A block with a missing or malformed field is silently ignored by search engines.

## How to fix

Fill the required schema.org fields reported in the message so the block becomes eligible for rich results. For your own types pass a schema map: `'jsonld:valid-schema': ['error', { schemas }]`.

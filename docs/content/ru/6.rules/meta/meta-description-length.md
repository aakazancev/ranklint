---
title: "meta:description-length"
description: "длина; { min, max }"
---

<!-- generated:start -->
| Категория | Область | Severity по умолчанию |
| --- | --- | --- |
| meta | page | warn |

длина; { min, max }

### Опции

| Опция | Тип | Описание |
| --- | --- | --- |
| `min` | integer |  |
| `max` | integer |  |
<!-- generated:end -->

## Почему это важно

Meta description — текст под заголовком в выдаче. Короче 70 символов он не использует место сниппета, длиннее 160 — обрезается поисковиком.

## Как исправить

Перепишите описание в одно-два предложения, которые укладываются в окно и описывают страницу. Границы меняются через `'meta:description-length': ['warn', { min, max }]` в ranklint.config.

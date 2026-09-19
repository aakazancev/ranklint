---
title: "images:no-lazy-above-fold"
description: "нет loading=lazy во вьюпорте; { firstImages }"
---

<!-- generated:start -->
| Категория | Область | Severity по умолчанию |
| --- | --- | --- |
| images | page | warn |

нет loading=lazy во вьюпорте; { firstImages }

### Опции

| Опция | Тип | Описание |
| --- | --- | --- |
| `firstImages` | integer |  |
<!-- generated:end -->

## Почему это важно

Картинка с `loading="lazy"` на первом экране грузится только после раскладки и напрямую задерживает LCP. Без данных о вьюпорте правило смотрит первые три изображения документа.

## Как исправить

Уберите `loading="lazy"` у изображений первого экрана, оставив ленивую загрузку ниже сгиба. Количество проверяемых первых картинок задаётся через `'images:no-lazy-above-fold': ['warn', { firstImages }]`.

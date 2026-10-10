---
"@ranklint/checks": patch
---

Collapse line breaks and repeated spaces in H1 and title text: `indexability:ssr-content` no longer reports multi-line headings as client-side only, `headings:h1-length` and `meta:title-length` measure the normalized text, and `headings:unique-h1`, `meta:no-duplicate-title` and `meta:no-duplicate-description` group duplicates that differ only in whitespace.
`http:no-soft-404` matches not-found titles split across lines and shows the normalized title in the message.

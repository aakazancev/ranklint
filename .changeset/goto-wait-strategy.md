---
'@ranklint/cli': patch
---

Page navigation waits for `domcontentloaded` instead of `networkidle`, then settles best-effort (`load` up to 10s, quiet network up to 5s). On pages with long-polling analytics `networkidle` never fired and every page burned the full 30s timeout with statusCode 0

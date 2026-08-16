---
'@ranklint/core': minor
'@ranklint/cli': minor
---

Add `crawl.entry` config option — seed paths for the crawl resolved against the audited URL. Fixes `--start` with multi-app zones, where the implicit server-root seed belongs to a foreign zone and nothing was crawled

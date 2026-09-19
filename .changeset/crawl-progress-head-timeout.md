---
'@ranklint/core': minor
'@ranklint/cli': patch
---

Crawl progress: `onPage` callback in core, CLI logs each crawled page to stderr (`[ranklint] 5/30 200 1234ms <url>`). Reachability HEAD requests are now wrapped in the crawl timeout — a hanging HEAD stalled the whole crawl forever

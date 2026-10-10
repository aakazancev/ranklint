---
"@ranklint/core": patch
"@ranklint/checks": patch
---

`normalizeUrl` strips tracking params (`utm_*`, `gclid`, `gbraid`, `wbraid`, `fbclid`, `yclid`, `msclkid`, `_gl`, `mc_cid`, `mc_eid`), so the crawler no longer visits `/a?utm_source=x` as a separate page. `links:no-broken`, `links:no-redirect-chain` and `links:permanent-redirects` check such links once and still report the original href.

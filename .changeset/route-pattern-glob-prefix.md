---
"@ranklint/core": patch
---

Route patterns ending with `/**` match their prefix as a glob, so `/*/market/**` covers `/en/market` and `/en/market/cars`

---
"@ranklint/checks": patch
"@ranklint/reporters": patch
---

`links:no-utm-internal` and `images:*` escape `"` and `\` in the attribute value of the issue selector. `markdownDiff`, the monitor dashboard and Slack/Telegram notifications list new and fixed issues by severity (error, warn, info), so errors are not cut off by the item limit.

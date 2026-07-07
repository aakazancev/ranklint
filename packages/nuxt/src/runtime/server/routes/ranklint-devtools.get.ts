import { defineEventHandler, setHeader } from '#imports'

const page = `<!doctype html>
<meta charset="utf-8">
<title>Ranklint SEO</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 13px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 16px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); padding-bottom: 4px; }
  .bar { display: flex; gap: 8px; align-items: center; }
  .url { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .8; }
  button { padding: 6px 14px; border: none; border-radius: 6px; background: #00dc82; color: #003c22; font-weight: 600; cursor: pointer; }
  button[disabled] { opacity: .5; cursor: default; }
  .h { display: flex; gap: 8px; padding: 2px 0; }
  .h .lvl { opacity: .5; width: 24px; }
  .bad { color: #e5484d; }
  .dim { opacity: .6; }
  .badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: #e5484d22; color: #e5484d; }
  .ok { background: #00dc8222; color: #00a862; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 3px 8px 3px 0; vertical-align: top; word-break: break-all; }
  td:first-child { opacity: .6; white-space: nowrap; }
  pre { background: color-mix(in srgb, currentColor 8%, transparent); padding: 8px; border-radius: 6px; overflow: auto; font-size: 12px; }
  .issue { margin: 6px 0; padding: 8px; border-left: 3px solid #e5484d; background: color-mix(in srgb, currentColor 6%, transparent); }
  .issue.warn { border-color: #ffb224; }
  .issue.info { border-color: #8899aa; }
  .issue .sg { opacity: .7; }
  .clickable { cursor: pointer; }
  .clickable:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
</style>
<div id="app">Loading…</div>
<script type="module" src="/__ranklint/devtools-client/main.mjs"></script>
`

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/html')
  return page
})

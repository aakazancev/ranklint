import { defineEventHandler, setHeader } from '#imports'

const page = `<!doctype html>
<meta charset="utf-8">
<title>Ranklint SEO</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 13px/1.5 -apple-system, system-ui, sans-serif; margin: 0; padding: 16px; }
  h2 { font-size: 14px; margin: 20px 0 8px; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); padding-bottom: 4px; }
  .bar { display: flex; gap: 8px; }
  input { flex: 1; padding: 6px 10px; border: 1px solid color-mix(in srgb, currentColor 30%, transparent); border-radius: 6px; background: transparent; color: inherit; }
  button { padding: 6px 14px; border: none; border-radius: 6px; background: #00dc82; color: #003c22; font-weight: 600; cursor: pointer; }
  .h { display: flex; gap: 8px; padding: 2px 0; }
  .h .lvl { opacity: .5; width: 24px; }
  .bad { color: #e5484d; }
  .badge { font-size: 11px; padding: 1px 6px; border-radius: 4px; background: #e5484d22; color: #e5484d; }
  .ok { background: #00dc8222; color: #00a862; }
  table { border-collapse: collapse; width: 100%; }
  td { padding: 3px 8px 3px 0; vertical-align: top; word-break: break-all; }
  td:first-child { opacity: .6; white-space: nowrap; }
  pre { background: color-mix(in srgb, currentColor 8%, transparent); padding: 8px; border-radius: 6px; overflow: auto; font-size: 12px; }
  .issue { margin: 6px 0; padding: 8px; border-left: 3px solid #e5484d; background: color-mix(in srgb, currentColor 6%, transparent); }
  .issue.warn { border-color: #ffb224; }
  .issue .sg { opacity: .7; }
</style>
<div class="bar">
  <input id="path" value="/" placeholder="/path/to/page">
  <button id="run">Audit</button>
</div>
<div id="out">Loading…</div>
<script>
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
async function audit() {
  const path = document.getElementById('path').value || '/'
  const out = document.getElementById('out')
  out.textContent = 'Auditing ' + path + '…'
  try {
    const r = await fetch('/__ranklint/page-report?path=' + encodeURIComponent(path))
    const d = await r.json()
    out.innerHTML =
      '<h2>Issues (' + d.issues.length + ')</h2>'
      + (d.issues.length === 0 ? '<p>No issues 🎉</p>' : d.issues.map(i =>
        '<div class="issue ' + esc(i.severity) + '"><b>' + esc(i.checkId) + '</b> — ' + esc(i.message)
        + (i.suggestion ? '<div class="sg">💡 ' + esc(i.suggestion) + '</div>' : '') + '</div>').join(''))
      + '<h2>Outline</h2>'
      + d.outline.map(h =>
        '<div class="h"><span class="lvl">H' + h.level + '</span><span class="' + (h.problems.length ? 'bad' : '') + '">'
        + (esc(h.text) || '<i>(empty)</i>') + '</span>'
        + h.problems.map(p => ' <span class="badge">' + esc(p) + '</span>').join('') + '</div>').join('')
      + '<h2>Meta</h2><table>'
      + Object.entries(d.meta).map(([k, v]) => '<tr><td>' + esc(k) + '</td><td>' + esc(v) + '</td></tr>').join('')
      + '</table>'
      + '<h2>JSON-LD (' + d.jsonLd.length + ')</h2>'
      + (d.jsonLd.length === 0 ? '<p>None</p>' : d.jsonLd.map(b =>
        '<div><b>' + esc(b.type) + '</b> <span class="badge ' + (b.valid ? 'ok' : '') + '">' + (b.valid ? 'valid' : 'invalid') + '</span>'
        + b.issues.map(i => '<div class="bad">' + esc(i.path) + ' — ' + esc(i.message) + '</div>').join('')
        + '<pre>' + esc(b.raw) + '</pre></div>').join(''))
  } catch (e) {
    out.innerHTML = '<p class="bad">Failed: ' + esc(e.message) + '</p>'
  }
}
document.getElementById('run').addEventListener('click', audit)
document.getElementById('path').addEventListener('keydown', e => { if (e.key === 'Enter') audit() })
audit()
</script>
`

export default defineEventHandler((event) => {
  setHeader(event, 'content-type', 'text/html')
  return page
})

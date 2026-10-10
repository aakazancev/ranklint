export const EXPLORER_CLIENT = String.raw`
var RANK = { error: 0, warn: 1, info: 2 }
var STEP = 40
var LOCALE = /^[a-z]{2}(-[a-z]{2})?$/i
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
function fmt(n) { return n.toLocaleString('en-US') }
function plural(n, one, many) { return fmt(n) + ' ' + (n === 1 ? one : many) }
function pathOf(u) { var p = u.replace(/^https?:\/\/[^/]+/, ''); return p || '/' }
function where(p) {
  var segs = p.split(/[?#]/)[0].split('/').filter(Boolean)
  var loc = segs.length && LOCALE.test(segs[0]) ? segs.shift().toLowerCase() : 'none'
  return { loc: loc, sec: segs[0] || '(home)' }
}
function prepare(D) {
  D.U = D.U.map(function (u) { var p = pathOf(u), w = where(p); return { url: u, path: p, loc: w.loc, sec: w.sec } })
  D.items = D.I.map(function (r) { return { r: r[0], u: r[1], m: r[2], sel: r[3], s: r[4], isNew: r[5] === 1, t: r[6] } })
  return D
}
function pageOk(D, u, st) {
  if (st.loc !== 'all' && u.loc !== st.loc) return false
  if (st.sec !== 'all' && u.sec !== st.sec) return false
  return true
}
function match(D, it, st, ignoreSev) {
  var rule = D.R[it.r], u = D.U[it.u]
  if (!ignoreSev && !st.sev[rule.sev]) return false
  if (!pageOk(D, u, st)) return false
  if (st.onlyNew && !it.isNew) return false
  if (st.q) { var q = st.q.toLowerCase(); if (u.path.toLowerCase().indexOf(q) < 0 && rule.id.indexOf(q) < 0 && D.M[it.m].toLowerCase().indexOf(q) < 0) return false }
  return true
}
function sevBadge(s) { return '<span class="sevb ' + s + '">' + s + '</span>' }
function scopeName(t) { return t.scope === 'site' ? 'site-wide' : '/' + esc(t.scope) }
function scopeText(t) { return scopeName(t) + ' · ' + fmt(t.hit) + ' of ' + fmt(t.base) + ' pages' }
function selBox(sel) { return sel ? '<span class="selw"><code class="sel">' + esc(sel) + '</code><button type="button" class="copy" data-copy="' + esc(sel) + '" aria-label="Copy selector">copy</button></span>' : '' }
function tplTag(t) { return '<span class="tpl" title="Same issue on ' + fmt(t.hit) + ' pages">shared · ' + fmt(t.hit) + ' pages</span>' }
function howTo(text) { return text ? '<b>How to fix</b> ' + esc(text) : '' }
function occRow(D, it) {
  var u = D.U[it.u]
  var alt = it.s >= 0 ? '<p class="altfix"><b>Fix here:</b> ' + esc(D.S[it.s]) + '</p>' : ''
  return '<li class="row"><div class="rh"><a class="pg" href="' + esc(u.url) + '" target="_blank" rel="noopener">' + esc(u.path) + '<span aria-hidden="true"> ↗</span></a>' + (it.isNew ? '<span class="new">new</span>' : '') + (it.t >= 0 ? tplTag(D.T[it.t]) : '') + '</div><p class="msg">' + esc(D.M[it.m]) + '</p>' + alt + selBox(it.sel) + '</li>'
}
function filtered(D, st) { return D.items.filter(function (it) { return match(D, it, st) }) }
function ruleGroups(D, st) {
  var map = {}, list = []
  filtered(D, st).forEach(function (it) {
    var g = map[it.r]; if (!g) { g = map[it.r] = { k: it.r, items: [], n: 0, pages: {} }; list.push(g) }
    g.items.push(it); g.pages[it.u] = 1; if (it.isNew) g.n++
  })
  list.sort(function (a, b) { return RANK[D.R[a.k].sev] - RANK[D.R[b.k].sev] || b.items.length - a.items.length || (D.R[a.k].id < D.R[b.k].id ? -1 : 1) })
  return list
}
function pageGroups(D, st) {
  var map = {}, list = []
  filtered(D, st).forEach(function (it) {
    var g = map[it.u]; if (!g) { g = map[it.u] = { k: it.u, items: [], e: 0, w: 0, i: 0, n: 0 }; list.push(g) }
    g.items.push(it)
    var sv = D.R[it.r].sev; if (sv === 'error') g.e++; else if (sv === 'warn') g.w++; else g.i++
    if (it.isNew) g.n++
  })
  list.sort(function (a, b) { return b.e - a.e || b.w - a.w || b.i - a.i })
  var hasAny = {}; D.items.forEach(function (it) { hasAny[it.u] = 1 })
  var clean = []
  D.U.forEach(function (u, k) { if (!hasAny[k] && pageOk(D, u, st) && (!st.q || u.path.toLowerCase().indexOf(st.q.toLowerCase()) >= 0)) clean.push(k) })
  return { list: list, clean: clean }
}
function ruleHead(D, g) {
  var rule = D.R[g.k]
  var pages = plural(Object.keys(g.pages).length, 'page', 'pages')
  return '<summary>' + sevBadge(rule.sev) + '<span class="gt"><code class="gid">' + esc(rule.id) + '</code><span class="gd">' + (rule.desc ? esc(rule.desc) + ' · ' : '') + pages + '</span></span>' + (g.n ? '<span class="gn">' + fmt(g.n) + ' new</span>' : '<span></span>') + '<span class="gc">' + fmt(g.items.length) + '</span></summary>'
}
function ruleBody(D, g, limit) {
  var rule = D.R[g.k]
  var tpls = D.T.filter(function (t) { return t.r === g.k })
  var tp = tpls.length ? '<ul class="tpls">' + tpls.map(function (t) { return '<li><span class="tpl">shared</span><span>' + esc(D.M[t.m]) + (t.sel ? ' <code>' + esc(t.sel) + '</code>' : t.el > 1 ? ' · ' + fmt(t.el) + ' shared elements' : '') + '</span><span class="sc">' + scopeText(t) + '</span></li>' }).join('') + '</ul>' : ''
  var shown = g.items.slice(0, limit), more = g.items.length - shown.length
  var fix = howTo(D.S[rule.fix])
  return (fix || rule.docs ? '<div class="fix"><p>' + fix + '</p>' + (rule.docs ? '<a class="docs" href="' + esc(rule.docs) + '" target="_blank" rel="noopener">docs<span aria-hidden="true"> ↗</span></a>' : '') + '</div>' : '') + tp +
    '<ul class="rows">' + shown.map(function (it) { return occRow(D, it) }).join('') + '</ul>' +
    (more > 0 ? '<button type="button" class="more" data-more="' + limit + '">Show ' + fmt(Math.min(STEP, more)) + ' more of ' + fmt(more) + '</button>' : '')
}
function pageHead(D, g) {
  var u = D.U[g.k]
  var pills = (g.e ? '<span class="pill error">' + fmt(g.e) + '<i> err</i></span>' : '') + (g.w ? '<span class="pill warn">' + fmt(g.w) + '<i> warn</i></span>' : '') + (g.i ? '<span class="pill info">' + fmt(g.i) + '<i> info</i></span>' : '')
  return '<summary><span class="pdot ' + (g.e ? 'error' : g.w ? 'warn' : 'info') + '" aria-hidden="true"></span><span class="gt"><code class="gid">' + esc(u.path) + '</code><span class="gd">' + esc(u.sec) + (u.loc === 'none' ? '' : ' · ' + esc(u.loc)) + (g.n ? ' · <b class="nw">' + fmt(g.n) + ' new</b>' : '') + '</span></span><span class="pills">' + pills + '</span></summary>'
}
function checklist(D, g) {
  var by = {}, order = []
  g.items.forEach(function (it) { var c = by[it.r]; if (!c) { c = by[it.r] = { r: it.r, items: [], msgs: {}, n: 0, t: null }; order.push(c) } c.items.push(it); c.msgs[it.m] = 1; if (it.isNew) c.n++; if (it.t >= 0 && (!c.t || D.T[it.t].hit > c.t.hit)) c.t = D.T[it.t] })
  order.sort(function (a, b) { return RANK[D.R[a.r].sev] - RANK[D.R[b.r].sev] || b.items.length - a.items.length })
  return order
}
function what(D, c) {
  var ms = Object.keys(c.msgs), rule = D.R[c.r]
  if (ms.length === 1) return esc(D.M[ms[0]])
  return esc(rule.desc ? rule.desc.charAt(0).toUpperCase() + rule.desc.slice(1) : rule.id) + ' <span class="var">' + fmt(ms.length) + ' variants</span>'
}
function pageBody(D, g, limit) {
  var u = D.U[g.k]
  var items = checklist(D, g)
  return '<div class="ph"><a class="docs" href="' + esc(u.url) + '" target="_blank" rel="noopener">open ' + esc(u.path) + '<span aria-hidden="true"> ↗</span></a><span>' + plural(items.length, 'thing', 'things') + ' to fix on this page</span></div><ol class="todo">' + items.map(function (c) {
    var rule = D.R[c.r], cnt = c.items.length
    var fixes = {}, fx = []
    c.items.forEach(function (it) { var k = it.s >= 0 ? it.s : rule.fix; if (!fixes[k] && D.S[k]) { fixes[k] = 1; fx.push(D.S[k]) } })
    var many = Object.keys(c.msgs).length > 1
    var occ = c.items.slice(0, limit).map(function (it) { return '<li>' + (many ? '<span class="om">' + esc(D.M[it.m]) + '</span>' : '') + (it.isNew ? '<span class="new">new</span>' : '') + selBox(it.sel) + '</li>' }).join('')
    var rest = cnt - Math.min(cnt, limit)
    return '<li class="todo-i ' + rule.sev + '"><div class="ti-h">' + sevBadge(rule.sev) + '<span class="ti-n">' + (cnt > 1 ? fmt(cnt) + ' ×' : '') + '</span><p class="ti-w">' + what(D, c) + '</p></div>' +
      '<div class="ti-b">' + (fx.length ? '<p class="ti-f"><b>How to fix</b> ' + fx.map(esc).join('<br>') + '</p>' : '') +
      '<p class="ti-m"><code>' + esc(rule.id) + '</code>' + (rule.docs ? '<a href="' + esc(rule.docs) + '" target="_blank" rel="noopener">docs ↗</a>' : '') + (c.n ? '<span class="new">' + (c.n === cnt ? 'new' : fmt(c.n) + ' new') + '</span>' : '') + (c.t ? '<span class="tpl">shared · ' + scopeName(c.t) + ' · ' + fmt(c.t.hit) + ' pages · fix once in the template</span>' : '') + '</p>' +
      (c.items.some(function (it) { return it.sel }) || many ? '<details class="occ"><summary>' + plural(cnt, 'element', 'elements') + '</summary><ul>' + occ + '</ul>' + (rest ? '<p class="rest">and ' + fmt(rest) + ' more</p>' : '') + '</details>' : '') + '</div></li>'
  }).join('') + '</ol>'
}
function templates(D, st) {
  var list = D.T.filter(function (t) { return st.sev[D.R[t.r].sev] }).slice().sort(function (a, b) { return RANK[D.R[a.r].sev] - RANK[D.R[b.r].sev] || b.hit - a.hit })
  if (!list.length) return ''
  var total = list.reduce(function (s, t) { return s + t.n }, 0)
  return '<details class="fixonce" open><summary><span class="fo-t">Fix once</span><span class="fo-d">' + plural(list.length, 'issue repeats', 'issues repeat') + ' across a whole section or the whole site. Each is most likely one template or component: ' + plural(total, 'issue', 'issues') + ' in total.</span></summary><ol>' + list.map(function (t) {
    var rule = D.R[t.r]
    return '<li class="' + rule.sev + '">' + sevBadge(rule.sev) + '<div class="fo-b"><p>' + esc(D.M[t.m]) + '</p><p class="fo-m"><a href="#rule-' + esc(rule.id) + '" class="tl">' + esc(rule.id) + '</a>' + (t.sel ? ' <code>' + esc(t.sel) + '</code>' : '') + '</p></div><div class="fo-s"><b>' + fmt(t.hit) + '</b> / ' + fmt(t.base) + ' pages<span>' + scopeName(t) + '</span></div></li>'
  }).join('') + '</ol></details>'
}
function cleanBlock(D, clean) {
  if (!clean.length) return ''
  return '<details class="grp clean"><summary><span class="pdot ok" aria-hidden="true"></span><span class="gt"><code class="gid">Clean pages</code><span class="gd">no issues in this run</span></span><span class="pills"><span class="pill ok">' + fmt(clean.length) + '</span></span></summary><ul class="cl">' + clean.map(function (k) { var u = D.U[k]; return '<li><a class="pg" href="' + esc(u.url) + '" target="_blank" rel="noopener">' + esc(u.path) + ' ↗</a></li>' }).join('') + '</ul></details>'
}
function renderStatic(D, st) {
  if (st.mode === 'rule') return ruleGroups(D, st).map(function (g) { return '<details class="grp" id="rule-' + esc(D.R[g.k].id) + '">' + ruleHead(D, g) + ruleBody(D, g, 20) + '</details>' }).join('')
  var pg = pageGroups(D, st)
  return pg.list.map(function (g) { return '<details class="grp page" id="page-' + esc(D.U[g.k].path) + '">' + pageHead(D, g) + pageBody(D, g, 5) + '</details>' }).join('') + cleanBlock(D, pg.clean)
}
G.RL = { prepare: prepare, renderStatic: renderStatic, templates: templates, where: where }

if (typeof document === 'undefined') return
var root = document.getElementById('issues')
if (!root) return
var D = prepare(JSON.parse(document.getElementById('issues-data').textContent))
var st = { mode: root.dataset.mode || 'rule', sev: { error: true, warn: true, info: true }, q: '', sec: 'all', loc: 'all', onlyNew: false }
var list = root.querySelector('.glist'), tbox = root.querySelector('.tbox'), cur = [], shownBy = {}
var secSel = root.querySelector('#ex-sec'), locSel = root.querySelector('#ex-loc'), newBox = root.querySelector('#ex-new')
document.documentElement.classList.add('js')
function counts(pg) {
  var c = { error: 0, warn: 0, info: 0 }, tot = 0, pages = {}, rules = {}
  D.items.forEach(function (it) {
    if (!match(D, it, st, true)) return
    var sv = D.R[it.r].sev; c[sv]++
    if (st.sev[sv]) { tot++; pages[it.u] = 1; rules[it.r] = 1 }
  })
  ;['error', 'warn', 'info'].forEach(function (s) { root.querySelector('[data-sev="' + s + '"] .n').textContent = fmt(c[s]) })
  var np = Object.keys(pages).length
  root.querySelector('.ex-total').textContent = st.mode === 'page'
    ? plural(np, 'page', 'pages') + ' to fix · ' + plural(pg ? pg.clean.length : 0, 'clean page', 'clean pages') + ' · ' + plural(tot, 'issue', 'issues')
    : plural(tot, 'issue', 'issues') + ' · ' + plural(Object.keys(rules).length, 'rule', 'rules') + ' · ' + plural(np, 'page', 'pages')
}
function render() {
  root.dataset.mode = st.mode
  shownBy = {}
  var pg = null
  if (st.mode === 'rule') {
    cur = ruleGroups(D, st)
    list.innerHTML = cur.length ? cur.map(function (g, i) { return '<details class="grp" data-i="' + i + '" id="rule-' + esc(D.R[g.k].id) + '">' + ruleHead(D, g) + '<div class="gb"></div></details>' }).join('') : '<p class="none">Nothing matches these filters.</p>'
  } else {
    pg = pageGroups(D, st); cur = pg.list
    list.innerHTML = (cur.length ? cur.map(function (g, i) { return '<details class="grp page" data-i="' + i + '" id="page-' + esc(D.U[g.k].path) + '">' + pageHead(D, g) + '<div class="gb"></div></details>' }).join('') : '<p class="none">No pages with issues match these filters.</p>') + cleanBlock(D, pg.clean)
  }
  if (tbox) tbox.innerHTML = templates(D, st)
  counts(pg)
}
function fill(det, limit) {
  if (det.dataset.i == null) return
  var g = cur[+det.dataset.i]; shownBy[det.dataset.i] = limit
  det.querySelector('.gb').innerHTML = st.mode === 'rule' ? ruleBody(D, g, limit) : pageBody(D, g, 200)
}
list.addEventListener('toggle', function (e) { var d = e.target; if (d.classList.contains('grp') && d.open && d.querySelector('.gb') && !d.querySelector('.gb').innerHTML) fill(d, STEP) }, true)
root.addEventListener('click', function (e) {
  var t = e.target
  if (t.classList.contains('more')) { var d = t.closest('details'); fill(d, (shownBy[d.dataset.i] || STEP) + STEP) }
  if (t.classList.contains('copy') && navigator.clipboard) {
    navigator.clipboard.writeText(t.dataset.copy).then(function () { t.textContent = 'copied'; setTimeout(function () { t.textContent = 'copy' }, 1200) }, function () {})
  }
})
function setMode(m) { st.mode = m; root.querySelectorAll('[data-mode]').forEach(function (x) { if (x !== root) x.setAttribute('aria-pressed', String(x.dataset.mode === m)) }) }
root.querySelectorAll('button[data-mode]').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); render() }) })
root.querySelectorAll('[data-sev]').forEach(function (b) {
  b.addEventListener('click', function () { st.sev[b.dataset.sev] = !st.sev[b.dataset.sev]; b.setAttribute('aria-pressed', String(st.sev[b.dataset.sev])); render() })
})
var q = root.querySelector('#ex-q'), tmr
q.addEventListener('input', function () { clearTimeout(tmr); tmr = setTimeout(function () { st.q = q.value.trim(); render() }, 150) })
secSel.addEventListener('change', function (e) { st.sec = e.target.value; render() })
if (locSel) locSel.addEventListener('change', function (e) { st.loc = e.target.value; render() })
if (newBox) newBox.addEventListener('change', function (e) { st.onlyNew = e.target.checked; render() })
function decode(s) { try { return decodeURIComponent(s) } catch (e) { return s } }
function byHash(h) { return document.getElementById(h) || document.getElementById(decode(h)) }
function openHash() {
  var h = location.hash.slice(1)
  if (h.indexOf('rule-') !== 0 && h.indexOf('page-') !== 0) return
  var want = h.indexOf('rule-') === 0 ? 'rule' : 'page'
  if (st.mode !== want || !byHash(h)) {
    st.q = ''; q.value = ''; st.sec = 'all'; st.loc = 'all'; st.onlyNew = false; st.sev = { error: true, warn: true, info: true }
    secSel.value = 'all'; if (locSel) locSel.value = 'all'; if (newBox) newBox.checked = false
    root.querySelectorAll('[data-sev]').forEach(function (x) { x.setAttribute('aria-pressed', 'true') })
    setMode(want); render()
  }
  var d = byHash(h)
  if (d) { d.open = true; if (d.querySelector('.gb') && !d.querySelector('.gb').innerHTML) fill(d, STEP); d.scrollIntoView({ block: 'start' }) }
}
render()
window.addEventListener('hashchange', openHash)
document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href^="#rule-"],a[href^="#page-"]'); if (a && decode(a.getAttribute('href')) === decode(location.hash)) { e.preventDefault(); openHash() } })
openHash()
`

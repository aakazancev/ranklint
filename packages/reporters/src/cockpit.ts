import type { LighthouseResult } from '@ranklint/core'
import { esc } from './vitals'

export interface Brand {
  logo?: string
  name?: string
  accent?: string
}

export interface ChartSeries {
  name: string
  values: (number | undefined)[]
  cls: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

export const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Golos+Text:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&family=Unbounded:wght@500;700&display=swap" rel="stylesheet">'

export const WORDMARK = '<span class="wm">rank<span class="acid">lint</span><span class="acid" aria-hidden="true">▌</span></span>'

export const STYLE = `
:root{--ink-950:#0a0b0d;--ink-900:#0e1014;--ink-850:#111419;--ink-800:#171a20;--ink-750:#1e222a;--line:#1f232b;--line-strong:#2e333c;--fg:#edeff2;--fg-soft:#d3d8de;--fg-muted:#a8afb9;--fg-dim:#7c848f;--accent:#b4f13c;--accent-ink:#0a0b0d;--accent-line:color-mix(in srgb,var(--accent) 20%,var(--ink-900));--accent-bg:color-mix(in srgb,var(--accent) 6%,var(--ink-950));--accent-hover:color-mix(in srgb,var(--accent) 82%,#fff);--err:#ff5f56;--err-fg:#ff7b73;--err-bg:#2a1214;--warn:#f5a524;--warn-fg:#f5b54b;--info:#6ea8fe;--info-fg:#8fbcff;--r:4px;--sans:'Golos Text',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,monospace;--display:'Unbounded','Golos Text',system-ui,sans-serif;--rail:368px;--gap:20px;color-scheme:dark}
*{box-sizing:border-box}html{background:var(--ink-950);color:var(--fg-soft);font:15px/1.5 var(--sans)}body{margin:0}
a{color:inherit}code{font-family:var(--mono);font-size:.92em}h1,h2,h3{text-wrap:balance;margin:0}p{text-wrap:pretty}
.wm{font:700 18px/1 var(--mono);letter-spacing:-.02em;color:var(--fg)}.acid{color:var(--accent)}
.brand{display:flex;align-items:center;gap:10px;min-width:0}.brand-logo{display:block;height:28px;width:auto;max-width:180px;object-fit:contain}.brand-name{font:600 15px/1.2 var(--sans);color:var(--fg);overflow-wrap:anywhere}
.pw{display:flex;flex-wrap:wrap;gap:0 6px;align-items:baseline;font:12px var(--mono);color:var(--fg-dim)}.rail footer .pw{margin-bottom:6px}.meta-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px}.pw .wm{font-size:13px;text-decoration:none}.pw .acid{color:#b4f13c}
.shell{display:grid;grid-template-columns:var(--rail) 1fr;min-height:100vh}
.rail-out{background:var(--ink-900);border-right:1px solid var(--line)}.rail{position:sticky;top:0;min-height:100vh;background:var(--ink-900);padding:24px 28px;display:flex;flex-direction:column;gap:24px}
.rail-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.rail-head>span:last-child{font:12px var(--mono);color:var(--fg-dim)}
.site{display:flex;flex-direction:column;gap:2px}.site h1{font:500 22px/1.2 var(--display);color:var(--fg);overflow-wrap:anywhere}.site span{font:13px var(--mono);color:var(--fg-dim)}
.run-btn{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;min-height:44px;border-radius:var(--r);background:var(--accent);color:var(--accent-ink);font:600 15px var(--sans);text-decoration:none}.run-btn:hover{background:var(--accent-hover)}.run-btn kbd{font:500 12px var(--mono);opacity:.75}
.verdict{border-top:1px solid var(--line-strong);padding-top:20px;display:grid;gap:18px}
.read{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:2px 12px}
.read .lbl{grid-column:1/-1;font:500 13px var(--sans);color:var(--fg-muted)}
.read .val{font:500 28px/1 var(--mono);color:var(--fg);font-variant-numeric:tabular-nums}
.read.big .val{font:700 76px/.95 var(--display);letter-spacing:-.03em;color:var(--err)}
.read.err .val{color:var(--err)}.read.warn .val{color:var(--warn-fg)}.read.info .val{color:var(--info-fg)}
.dl{font:500 13px var(--mono);text-align:right}.dl em{display:block;font-style:normal;color:var(--fg-dim);font-weight:400}.dl.bad{color:var(--err-fg)}.dl.good{color:var(--accent)}.dl.flat{color:var(--fg-muted)}
.tape{grid-column:1/-1;position:relative;height:6px;background:var(--ink-750);border-radius:3px;margin-top:6px}.tape i{position:absolute;inset:0 auto 0 0;border-radius:3px;background:var(--fg-muted)}.tape b{position:absolute;top:-4px;width:2px;height:14px;background:var(--fg);opacity:.55}
.tape.err i{background:var(--err)}.tape.warn i{background:var(--warn)}.tape.info i{background:var(--info)}.tape.ok i{background:var(--accent)}
.read.big .tape{height:10px}
.pair{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px}
.legend-note{font:12px var(--mono);color:var(--fg-dim);display:flex;align-items:center;gap:8px}.legend-note b{display:inline-block;width:2px;height:12px;background:var(--fg);opacity:.55}
.rail footer{margin-top:auto;font:12px var(--mono);color:var(--fg-dim)}
main{padding:24px 32px 48px;display:grid;grid-template-columns:repeat(12,1fr);gap:var(--gap);align-content:start;min-width:0}
.panel{background:var(--ink-900);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;min-width:0}
.panel h2{font:600 15px var(--sans);color:var(--fg);display:flex;justify-content:space-between;gap:12px;align-items:baseline}.panel h2 small{font:400 12px var(--mono);color:var(--fg-dim)}
.span-7{grid-column:span 7}.span-5{grid-column:span 5}.span-4{grid-column:span 4}.span-8{grid-column:span 8}.span-6{grid-column:span 6}.span-12{grid-column:1/-1}
.delta-head{display:flex;flex-wrap:wrap;gap:8px 24px;margin:14px 0 12px;font:500 14px var(--mono)}.delta-head .e{color:var(--err-fg)}.delta-head .w{color:var(--warn-fg)}.delta-head .i{color:var(--info-fg)}.delta-head span{display:flex;gap:6px;align-items:baseline}.delta-head strong{font:700 30px/1 var(--display)}
.rules{list-style:none;margin:0;padding:0}.rules li{position:relative;display:grid;grid-template-columns:54px 1fr auto;gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line)}
.sev{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.04em;padding:2px 0;border-radius:2px;text-align:center}
li.error .sev,.sevb.error{background:var(--err-bg);color:var(--err-fg)}li.warn .sev,.sevb.warn{background:#2a2110;color:var(--warn-fg)}li.info .sev,.sevb.info{background:#121c2c;color:var(--info-fg)}
.rules code{color:var(--fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rules .ct{font:500 14px var(--mono);color:var(--fg-soft);font-variant-numeric:tabular-nums}
li.warn code,li.info code{color:var(--fg-muted)}
details summary{cursor:pointer;font:500 13px var(--sans);color:var(--fg-muted);padding:10px 0;min-height:44px;display:flex;align-items:center}
.fixed .ct{color:var(--accent)}
.muted{margin:14px 0 0;color:var(--fg-muted);font-size:14px}
svg.chart{width:100%;height:auto;display:block;margin-top:10px;overflow:visible}
.gr{stroke:var(--line)}.ax{fill:var(--fg-dim);font:12px var(--mono)}
.s path{fill:none;stroke-width:2.5}.s text{font:600 13px var(--mono)}
.s.err path{stroke:var(--err)}.s.err circle,.s.err text{fill:var(--err)}.s.warn path{stroke:var(--warn)}.s.warn circle,.s.warn text{fill:var(--warn-fg)}
.s.acid path{stroke:var(--accent)}.s.acid circle,.s.acid text{fill:var(--accent)}.s.c2 path{stroke:var(--fg-soft)}.s.c2 circle,.s.c2 text{fill:var(--fg-soft)}.s.c3 path{stroke:var(--info)}.s.c3 circle,.s.c3 text{fill:var(--info-fg)}.s.c4 path{stroke:var(--fg-dim);stroke-dasharray:4 4}.s.c4 circle,.s.c4 text{fill:var(--fg-muted)}
.key{display:flex;flex-wrap:wrap;gap:14px;list-style:none;padding:0;margin:10px 0 0;font:12px var(--mono);color:var(--fg-muted)}.key li::before{content:"";display:inline-block;width:10px;height:3px;margin-right:6px;vertical-align:middle;background:currentColor}
.key .err{color:var(--err-fg)}.key .warn{color:var(--warn-fg)}.key .acid{color:var(--accent)}.key .c2{color:var(--fg-soft)}.key .c3{color:var(--info-fg)}.key .c4{color:var(--fg-muted)}
.empty{margin-top:14px;padding:16px;border:1px dashed var(--line-strong);border-radius:var(--r);display:grid;gap:8px}.empty .m{display:flex;gap:16px;font:500 22px var(--mono);color:var(--fg-dim)}.empty .m small{display:block;font:12px var(--sans)}.empty p{margin:0;font-size:13px;color:var(--fg-muted)}.empty code{color:var(--fg-soft)}
.vit{display:flex;flex-wrap:wrap;gap:12px 24px;margin-top:14px}.vit div{display:grid;gap:2px}.vit span{font:500 12px var(--sans);color:var(--fg-muted)}.vit b{font:500 22px/1 var(--mono);color:var(--fg)}.vit em{font:500 12px var(--mono);font-style:normal}.vit .good em{color:var(--accent)}.vit .needs-improvement em{color:var(--warn-fg)}.vit .poor em{color:var(--err-fg)}
table{width:100%;border-collapse:collapse;font-size:14px}th{font:500 12px var(--sans);color:var(--fg-dim);text-align:left;padding:8px 10px 8px 0}td{padding:9px 10px 9px 0;border-top:1px solid var(--line);font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap}td.num,th.num{text-align:right}
td .bar{display:inline-block;height:6px;border-radius:3px;vertical-align:middle}td.error .bar{background:var(--err)}td.warn .bar{background:var(--warn)}td.info .bar{background:var(--info)}
.sevb{font:700 11px var(--mono);text-transform:uppercase;padding:2px 6px;border-radius:2px}
.scroll{overflow-x:auto}
.lhrow{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:4px 10px;align-items:center;padding:7px 0;border-top:1px solid var(--line);font:13px var(--mono)}.lhrow .u{color:var(--fg-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lhrow .v{text-align:right;font-weight:700}.lhrow .bar{grid-column:1/-1;height:4px;background:var(--ink-750);border-radius:2px}.lhrow .bar i{display:block;height:100%;border-radius:2px}.lhrow .meta{grid-column:1/-1;color:var(--fg-dim);font-size:12px}.lhrow .meta.tip{color:var(--fg-muted);font-family:var(--sans)}
.poor{color:var(--err-fg)}.poor-b{background:var(--err)}.mid{color:var(--warn-fg)}.mid-b{background:var(--warn)}.top{color:var(--accent)}.top-b{background:var(--accent)}
.runs a{color:var(--accent);text-underline-offset:3px}.runs td.e{color:var(--err-fg)}.runs td.w{color:var(--warn-fg)}
.jump{display:flex;gap:4px;border:1px solid var(--line);border-radius:var(--r);padding:3px}.jump a{flex:1;text-align:center;padding:8px 6px;min-height:40px;display:flex;align-items:center;justify-content:center;gap:6px;border-radius:3px;text-decoration:none;font:500 14px var(--sans);color:var(--fg-muted)}.jump a:hover{background:var(--ink-800);color:var(--fg)}.jump span{font:500 12px var(--mono);color:var(--err-fg)}
.go{display:contents;color:inherit;text-decoration:none}a.go code{text-decoration:underline;text-decoration-color:var(--line-strong);text-underline-offset:4px}a.go:hover code{text-decoration-color:var(--accent);color:var(--accent)}.gone code{opacity:.75}
.tl{color:inherit;text-decoration:underline;text-decoration-color:var(--line-strong);text-underline-offset:4px}.tl:hover{color:var(--accent);text-decoration-color:var(--accent)}
.ex{padding:22px 24px}.ex-top{position:sticky;top:0;z-index:3;background:var(--ink-900);margin:-22px -24px 0;padding:22px 24px 14px;border-bottom:1px solid var(--line)}
.ex h2{font:500 20px var(--display)}.ex h2 small{font:400 13px var(--mono)}
.ex-bar{display:none;flex-wrap:wrap;gap:10px 12px;align-items:center;margin-top:14px}html.js .ex-bar{display:flex}html.js .nojs-note{display:none}
.seg{display:inline-flex;border:1px solid var(--line-strong);border-radius:var(--r);padding:3px;gap:3px}.seg button,.chip{font:500 14px var(--sans);color:var(--fg-muted);background:none;border:0;border-radius:3px;min-height:38px;padding:0 14px;cursor:pointer}.seg button[aria-pressed=true]{background:var(--accent);color:var(--accent-ink)}
.chips{display:inline-flex;gap:6px}.chip{border:1px solid var(--line-strong);display:inline-flex;align-items:center;gap:8px;font-family:var(--mono);font-size:13px;text-transform:uppercase}.chip .n{font-weight:700}
.chip.error[aria-pressed=true]{background:var(--err-bg);border-color:var(--err);color:var(--err-fg)}.chip.warn[aria-pressed=true]{background:#2a2110;border-color:var(--warn);color:var(--warn-fg)}.chip.info[aria-pressed=true]{background:#121c2c;border-color:var(--info);color:var(--info-fg)}.chip[aria-pressed=false]{color:var(--fg-dim);text-decoration:line-through}
.srch{flex:1 1 240px}.srch input,.sel-f select{width:100%;min-height:44px;background:var(--ink-950);border:1px solid var(--line-strong);border-radius:var(--r);color:var(--fg);font:14px var(--mono);padding:0 12px}.srch input::placeholder{color:var(--fg-dim)}.srch input:focus,.sel-f select:focus{outline:2px solid var(--accent);outline-offset:1px}
.sel-f{display:flex;align-items:center;gap:8px;font:500 13px var(--sans);color:var(--fg-dim)}.sel-f select{width:auto;max-width:280px}
.tgl{display:inline-flex;align-items:center;gap:8px;min-height:44px;font:500 14px var(--sans);color:var(--fg-muted);cursor:pointer}.tgl input{accent-color:var(--accent);width:18px;height:18px}.tgl span{font:500 12px var(--mono);color:var(--accent)}
.vh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.glist{margin-top:6px}.grp{border-bottom:1px solid var(--line)}.grp>summary{list-style:none;display:grid;grid-template-columns:62px minmax(0,1fr) auto 64px;gap:14px;align-items:center;padding:12px 4px;min-height:56px;cursor:pointer}.grp>summary::-webkit-details-marker{display:none}
.grp>summary:hover{background:var(--ink-850)}.grp[open]>summary{background:var(--ink-850)}
.grp>summary .sevb{text-align:center}.gt{display:flex;flex-direction:column;min-width:0}.gid{color:var(--fg);font-size:15px;overflow-wrap:anywhere}.gd{font-size:13px;color:var(--fg-muted)}.gc{font:700 18px var(--mono);text-align:right;color:var(--fg);font-variant-numeric:tabular-nums}.gc::after{content:" ▾";font-size:12px;color:var(--fg-dim)}.grp[open] .gc::after{content:" ▴"}
.gn{font:500 12px var(--mono);color:var(--err-fg);border:1px solid #5a2422;border-radius:10px;padding:1px 8px;white-space:nowrap}
.pdot{width:10px;height:10px;border-radius:50%;justify-self:center}.pdot.error{background:var(--err)}.pdot.warn{background:var(--warn)}.pdot.info{background:var(--info)}
.fix{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:4px 0 6px 80px;padding:12px 16px;background:var(--ink-800);border-left:3px solid var(--accent);border-radius:0 var(--r) var(--r) 0}.fix p{margin:0;color:var(--fg-soft);font-size:14px}.fix b{color:var(--accent);font-weight:600;margin-right:6px}
.docs{flex:none;font:500 13px var(--mono);color:var(--accent);min-height:32px;display:inline-flex;align-items:center}
.rows{list-style:none;margin:0 0 10px 80px;padding:0}.row{padding:10px 0;border-top:1px solid var(--line);display:grid;gap:4px}.row:first-child{border-top:0}
.rh{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.pg{font:500 14px var(--mono);color:var(--fg);text-decoration:none;overflow-wrap:anywhere}.pg:hover{color:var(--accent)}.pg span{color:var(--fg-dim)}
.new{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--ink-950);background:var(--err-fg);padding:1px 6px;border-radius:2px}
.msg{margin:0;font-size:14px;color:var(--fg-soft);overflow-wrap:anywhere}.altfix{margin:0;font-size:13px;color:var(--fg-muted)}.altfix b{color:var(--accent);font-weight:500}
.selw{display:flex;align-items:flex-start;gap:8px;max-width:100%}.sel{font-size:12px;color:var(--fg-muted);background:var(--ink-950);border:1px solid var(--line);border-radius:3px;padding:4px 8px;overflow-wrap:anywhere;user-select:all;min-width:0}
.copy{display:none;flex:none;font:500 12px var(--mono);color:var(--fg-muted);background:none;border:1px solid var(--line-strong);border-radius:3px;min-height:28px;padding:0 10px;cursor:pointer}html.js .copy{display:inline-flex;align-items:center}.copy:hover{color:var(--accent);border-color:var(--accent)}
.more{margin:0 0 14px 80px;min-height:44px;padding:0 16px;font:500 14px var(--sans);color:var(--fg);background:var(--ink-800);border:1px solid var(--line-strong);border-radius:var(--r);cursor:pointer}html:not(.js) .more{display:none}
.none{padding:24px 4px;color:var(--fg-muted)}.nojs-note{font-size:13px;color:var(--fg-dim);margin:14px 0 0}.nojs-note a{color:var(--accent)}
.tbox{margin-top:16px}.fixonce{border:1px solid var(--accent-line);border-radius:var(--r);background:var(--accent-bg)}.fixonce>summary{list-style:none;cursor:pointer;display:flex;gap:16px;align-items:baseline;padding:14px 16px;flex-wrap:wrap}.fixonce>summary::-webkit-details-marker{display:none}.fo-t{font:500 16px var(--display);color:var(--accent)}.fo-d{font-size:14px;color:var(--fg-muted);flex:1 1 400px}
.fixonce ol{list-style:none;margin:0;padding:0 16px 8px}.fixonce li{display:grid;grid-template-columns:62px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 0;border-top:1px solid var(--accent-line)}.fixonce li .sevb{text-align:center}.fo-b p{margin:0;color:var(--fg);font-size:14px;overflow-wrap:anywhere}.fo-b .fo-m{font:12px var(--mono);color:var(--fg-dim);overflow-wrap:anywhere;margin-top:2px}.fo-m code{color:var(--fg-muted)}.fo-s{text-align:right;font:13px var(--mono);color:var(--fg-muted);white-space:nowrap}.fo-s b{font-size:18px;color:var(--fg)}.fo-s span{display:block;font-size:12px;color:var(--accent)}
.tpl{font:500 11px var(--mono);color:var(--accent);border:1px solid var(--accent-line);background:var(--accent-bg);border-radius:10px;padding:1px 8px;white-space:nowrap}
.tpls{list-style:none;margin:0 0 8px 80px;padding:0}.tpls li{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline;padding:6px 0;font-size:13px;color:var(--fg-soft)}.tpls code{font-size:12px;color:var(--fg-muted);overflow-wrap:anywhere}.tpls .sc{font:12px var(--mono);color:var(--fg-dim)}
.grp.page>summary{grid-template-columns:20px minmax(0,1fr) auto}.pills{display:flex;gap:6px;justify-content:flex-end}.pill{font:700 14px var(--mono);padding:3px 9px;border-radius:3px;white-space:nowrap}.pill i{font-style:normal;font-weight:400;font-size:12px}.pill.error{background:var(--err-bg);color:var(--err-fg)}.pill.warn{background:#2a2110;color:var(--warn-fg)}.pill.info{background:#121c2c;color:var(--info-fg)}.pill.ok{background:var(--accent-bg);color:var(--accent)}.pdot.ok{background:var(--accent)}
.gd .nw,.ti-m .nw{color:var(--err-fg);font-weight:500}
.ph{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:6px 0 4px 34px;font-size:13px;color:var(--fg-dim);flex-wrap:wrap-reverse}.ph .docs{font-size:14px;flex:0 1 auto;min-width:0;overflow-wrap:anywhere}
.todo{list-style:none;margin:0 0 14px 34px;padding:0;border-left:1px solid var(--line-strong)}.todo-i{padding:12px 0 12px 18px;border-top:1px solid var(--line);position:relative}.todo-i:first-child{border-top:0}.todo-i::before{content:"";position:absolute;left:-4px;top:19px;width:7px;height:7px;border-radius:50%;background:var(--fg-dim)}.todo-i.error::before{background:var(--err)}.todo-i.warn::before{background:var(--warn)}.todo-i.info::before{background:var(--info)}
.ti-h{display:grid;grid-template-columns:62px auto minmax(0,1fr);gap:10px;align-items:baseline}.ti-h .sevb{text-align:center}.ti-n{font:700 15px var(--mono);color:var(--fg);white-space:nowrap}.ti-w{margin:0;font-size:15px;color:var(--fg);font-weight:500;overflow-wrap:anywhere}.var{font:12px var(--mono);color:var(--fg-dim);font-weight:400}
.ti-b{margin-left:72px;display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-top:6px;min-width:0}.ti-b>*{min-width:0;overflow-wrap:anywhere}.grp .gb,.todo-i,.ph a{min-width:0;overflow-wrap:anywhere}.ti-f{margin:0;font-size:14px;color:var(--fg-soft)}.ti-f b{color:var(--accent);font-weight:600;margin-right:6px}.ti-m{margin:0;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;font-size:12px}.ti-m code{color:var(--fg-dim);font-size:12px}.ti-m a{color:var(--accent);font:500 12px var(--mono)}
.occ>summary{cursor:pointer;font:500 13px var(--sans);color:var(--fg-muted);min-height:36px;display:inline-flex;align-items:center}.occ ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}.occ li{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.om{font-size:13px;color:var(--fg-muted);flex-basis:100%}.rest{font-size:12px;color:var(--fg-dim);margin:6px 0 0}
.cl{list-style:none;margin:0 0 12px 34px;padding:0;columns:3;column-gap:24px}.cl li{padding:4px 0}
.rbar{display:flex;align-items:center;gap:20px;padding:0 32px;height:60px;border-bottom:1px solid var(--line);background:var(--ink-900)}.rbar .back{font:500 14px var(--sans);color:var(--fg-muted);text-decoration:none;min-height:44px;display:inline-flex;align-items:center}.rbar .back:hover{color:var(--accent)}.rbar .sp{flex:1}.rbar .src{font:13px var(--mono);color:var(--fg-dim)}
.rmain{max-width:1280px;margin:0 auto;padding:28px 32px 64px;display:grid;grid-template-columns:minmax(0,1fr);gap:20px}
.rhead{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 40px;align-items:end}.rhead h1{font:500 30px/1.15 var(--display);color:var(--fg);overflow-wrap:anywhere}.rhead p{margin:6px 0 0;font:14px var(--mono);color:var(--fg-dim)}
.reads{display:flex;gap:28px;flex-wrap:wrap}.rr{display:grid;gap:2px}.rr .lbl{font:500 13px var(--sans);color:var(--fg-muted)}.rr .val{font:500 28px/1 var(--mono);color:var(--fg)}.rr.err .val{font:700 44px/1 var(--display);color:var(--err)}.rr.warn .val{color:var(--warn-fg)}.rr.info .val{color:var(--info-fg)}.rr .dl{text-align:left}.rr .dl em{display:inline}
.cov{font:13px var(--mono);color:var(--fg-dim)}.cov b{color:var(--fg);font-weight:500}
@media (max-width:1100px){.shell{grid-template-columns:1fr}.rail{position:static;min-height:0}.rail-out{border-right:0;border-bottom:1px solid var(--line)}main{grid-template-columns:1fr}main>*{grid-column:1/-1!important}}
@media (max-width:600px){html{font-size:15px}.rail{padding:20px 16px;gap:20px}main{padding:16px 16px 40px;gap:14px}.panel{padding:16px}.read.big .val{font-size:64px}.pair{gap:16px}.read .val{font-size:24px}.delta-head{gap:8px 18px}.delta-head strong{font-size:26px}.ex{padding:16px}.ex-top{margin:-16px -16px 0;padding:16px;position:static}.ex h2{font-size:17px;flex-direction:column;gap:4px}.ex-bar{gap:8px}.seg{width:100%}.seg button{flex:1}.chips{width:100%}.chip{flex:1;justify-content:center;padding:0 6px}.srch{flex:1 1 100%}.sel-f{flex:1 1 calc(50% - 4px);flex-direction:column;align-items:stretch;gap:2px;min-width:0}.sel-f select{max-width:none;width:100%}.grp>summary{grid-template-columns:auto 1fr auto;gap:6px 10px;padding:12px 2px}.grp>summary .sevb{padding:2px 6px}.grp>summary .sevb,.grp>summary .pdot{grid-row:1;grid-column:1;justify-self:start}.grp>summary .gn{grid-row:1;grid-column:2;justify-self:start}.grp>summary .gc{grid-row:1;grid-column:3}.grp>summary .gt{grid-row:2;grid-column:1/-1}.fix{margin-left:0;flex-direction:column;gap:6px}.rows{margin-left:0}.more{margin-left:0;width:100%}.fixonce li{grid-template-columns:auto minmax(0,1fr);gap:6px 10px}.fixonce li .sevb{padding:2px 6px}.fo-s{grid-column:1/-1;text-align:left;display:flex;gap:8px;align-items:baseline}.fo-s span{display:inline}.tpls{margin-left:0}.grp.page>summary{grid-template-columns:14px minmax(0,1fr);gap:6px 10px}.grp.page>summary .gt{grid-row:1;grid-column:2}.grp.page>summary .pdot{grid-row:1;grid-column:1;align-self:center}.grp.page>summary .pills{grid-row:2;grid-column:2;justify-content:flex-start}.ph{margin-left:0}.todo{margin-left:0;border-left:0}.todo-i{padding-left:0}.todo-i::before{display:none}.ti-h{grid-template-columns:auto auto minmax(0,1fr);gap:8px}.ti-h .sevb{padding:2px 6px}.ti-h .ti-w{grid-column:1/-1}.ti-b{margin-left:0}.cl{margin-left:0;columns:1}.copy{min-height:40px}.occ>summary{min-height:44px}.tpl{white-space:normal}.ti-m{gap:6px 10px}.hide-m{display:none}td.rule{border-left:3px solid;padding-left:8px;white-space:normal;word-break:break-all}td.rule.error{border-left-color:var(--err)}td.rule.warn{border-left-color:var(--warn);color:var(--fg-muted)}td.rule.info{border-left-color:var(--info)}.runs td:first-child{white-space:normal}.rbar{padding:8px 16px;gap:4px 12px;height:auto;min-height:60px;flex-wrap:wrap}.rbar .src{display:none}.rbar .sp{display:none}.rbar .meta-r{flex-basis:100%;align-items:flex-start}.rmain{padding:18px 16px 48px;gap:14px}.rhead{grid-template-columns:1fr}.rhead h1{font-size:22px}.reads{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rr.err{grid-column:1/-1}.brand-logo{max-width:140px}}
`

export function n(value: number): string {
  return value.toLocaleString('en-US')
}

export function signed(diff: number): string {
  if (diff > 0) return `+${n(diff)}`
  if (diff < 0) return `−${n(-diff)}`
  return '±0'
}

function parse(timestamp: string): Date | undefined {
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function clock(timestamp: string): string {
  const date = parse(timestamp)
  return date ? `${date.toISOString().slice(11, 16)} UTC` : timestamp
}

export function day(timestamp: string): string {
  const date = parse(timestamp)
  return date ? `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}` : timestamp
}

export function since(previous: string, current: string): string {
  if (day(previous) === day(current)) return clock(previous)
  return `${day(previous).split(' ').slice(0, 2).join(' ')}, ${clock(previous)}`
}

export function host(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

export function shortPath(url: string): string {
  return url.replace(/^https?:\/\/[^/]+/, '') || '/'
}

export function isHexColor(value: string): boolean {
  return HEX.test(value)
}

function luminance(hex: string): number {
  const full = hex.length === 4 ? hex.slice(1).split('').map(c => c + c).join('') : hex.slice(1)
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = Number.parseInt(full.slice(i, i + 2), 16) / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function accentInk(hex: string): '#0a0b0d' | '#ffffff' {
  const l = luminance(hex)
  const dark = luminance('#0a0b0d')
  return (l + 0.05) / (dark + 0.05) >= 1.05 / (l + 0.05) ? '#0a0b0d' : '#ffffff'
}

function brandStyle(brand: Brand | undefined): string {
  if (!brand?.accent) return ''
  if (!isHexColor(brand.accent)) throw new Error(`Invalid accent color "${brand.accent}": use #rgb or #rrggbb`)
  return `:root{--accent:${brand.accent.toLowerCase()};--accent-ink:${accentInk(brand.accent)}}`
}

export function brandMark(brand: Brand | undefined): string {
  if (!brand?.logo) return WORDMARK
  const name = brand.name ? `<span class="brand-name">${esc(brand.name)}</span>` : ''
  return `<span class="brand"><img class="brand-logo" src="${esc(brand.logo)}" alt="${esc(brand.name ?? 'logo')}">${name}</span>`
}

export function poweredBy(brand: Brand | undefined): string {
  if (!brand?.logo) return ''
  return '<div class="pw">powered by <a class="wm" href="https://ranklint.dev" target="_blank" rel="noopener">rank<span class="acid">lint</span><span class="acid" aria-hidden="true">▌</span></a></div>'
}

export function page(title: string, body: string, brand: Brand | undefined, scripts = ''): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${FONTS}
<style>${STYLE}${brandStyle(brand)}</style>
</head>
<body>
${body}
${scripts}</body>
</html>
`
}

export function perfClass(score: number): 'poor' | 'mid' | 'top' {
  if (score < 50) return 'poor'
  return score < 90 ? 'mid' : 'top'
}

export function lighthouseRows(results: LighthouseResult[], detailed: boolean): string {
  return results.map((result) => {
    const perf = result.metrics.performance
    const path = shortPath(result.url)
    const meta: string[] = []
    if (detailed) {
      if (result.metrics.seo !== undefined) meta.push(`SEO ${Math.round(result.metrics.seo)}`)
      if (result.metrics.accessibility !== undefined) meta.push(`A11y ${Math.round(result.metrics.accessibility)}`)
      if (result.metrics.bestPractices !== undefined) meta.push(`BP ${Math.round(result.metrics.bestPractices)}`)
    }
    if (result.metrics.lcp !== undefined) meta.push(`LCP ${(result.metrics.lcp / 1000).toFixed(1)} s`)
    if (result.metrics.tbt !== undefined) meta.push(`TBT ${n(Math.round(result.metrics.tbt))} ms`)
    if (result.metrics.cls !== undefined) meta.push(`CLS ${result.metrics.cls.toFixed(2)}`)
    if (detailed) meta.push(`${esc(result.aggregation)} of ${result.runs} runs`)
    const tone = perf === undefined ? 'mid' : perfClass(perf)
    const tip = detailed && result.lcpElement?.suggestion ? `<span class="meta tip">${esc(result.lcpElement.suggestion)}</span>` : ''
    return `<div class="lhrow"><a class="u tl" href="#page-${esc(path)}">${esc(path)}</a><span class="v ${tone}">${perf === undefined ? '—' : Math.round(perf)}</span><span class="bar"><i class="${tone}-b" style="width:${perf === undefined ? 0 : Math.round(perf)}%"></i></span><span class="meta">${meta.join(' · ')}</span>${tip}</div>`
  }).join('')
}

function niceMax(peak: number): number {
  if (peak <= 0) return 4
  const raw = (peak * 1.1) / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map(m => m * magnitude).find(s => s >= raw)!
  return Math.max(1, step) * 4
}

export function lineChart(series: ChartSeries[], labels: string[], opts: { max?: number, format?: (value: number) => string } = {}): string {
  const width = 420
  const height = 220
  const [top, right, bottom, left] = [16, 16, 28, 48]
  const format = opts.format ?? ((value: number) => n(Math.round(value)))
  const values = series.flatMap(s => s.values.filter((v): v is number => v !== undefined))
  const max = opts.max ?? niceMax(Math.max(...values))
  const count = labels.length
  const x = (i: number) => left + (count === 1 ? (width - left - right) / 2 : (i * (width - left - right)) / (count - 1))
  const y = (v: number) => top + (height - top - bottom) - (v / max) * (height - top - bottom)
  let svg = ''
  for (let k = 0; k <= 4; k++) {
    const v = (max * k) / 4
    svg += `<line class="gr" x1="${left}" x2="${width - right}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${left - 8}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${esc(format(v))}</text>`
  }
  const shown = count <= 3 ? labels.map((_, i) => i) : [0, count - 1]
  for (const i of shown) {
    const anchor = count > 1 && i === 0 ? 'start' : count > 1 && i === count - 1 ? 'end' : 'middle'
    svg += `<text class="ax" x="${x(i).toFixed(1)}" y="${height - 8}" text-anchor="${anchor}">${esc(labels[i]!)}</text>`
  }
  const ends = series.map((s, index) => {
    const last = [...s.values].reverse().find(v => v !== undefined)
    return { index, y: last === undefined ? 0 : y(last) - 9 }
  }).sort((a, b) => a.y - b.y)
  for (let k = 1; k < ends.length; k++) {
    if (ends[k]!.y - ends[k - 1]!.y < 14) ends[k]!.y = ends[k - 1]!.y + 14
  }
  const endY = new Map(ends.map(e => [e.index, e.y]))
  series.forEach((s, index) => {
    let path = ''
    let pen = 'M'
    let dots = ''
    let lastIndex = -1
    s.values.forEach((value, i) => {
      if (value === undefined) {
        pen = 'M'
        return
      }
      path += `${pen}${x(i).toFixed(1)} ${y(value).toFixed(1)}`
      pen = 'L'
      lastIndex = i
      dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(value).toFixed(1)}" r="3.5"><title>${esc(`${s.name} · ${labels[i]} · ${format(value)}`)}</title></circle>`
    })
    if (lastIndex < 0) return
    const label = `<text x="${(x(lastIndex) - 8).toFixed(1)}" y="${endY.get(index)!.toFixed(1)}" text-anchor="end">${esc(format(s.values[lastIndex]!))}</text>`
    svg += `<g class="s ${s.cls}"><path d="${path}"/>${dots}${label}</g>`
  })
  const aria = series.map(s => `${s.name}: ${s.values.map(v => (v === undefined ? '—' : format(v))).join(' → ')}`).join('; ')
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(aria)}">${svg}</svg><ul class="key">${series.map(s => `<li class="${s.cls}">${esc(s.name)}</li>`).join('')}</ul>`
}

import type { AppZone, Issue } from '@ranklint/core'
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { createApp, defineComponent, h, ref, shallowRef, type VNodeChild } from 'vue'
import { buildPageReport, collectInternalLinks, linkZone, type JsonLdBlock, type OutlineNode, type PageReport } from '../report'
import { connectHostPage, type HostPage } from './host'

interface LinkResult {
  href: string
  count: number
  state: 'pending' | 'ok' | 'broken' | 'failed'
  status?: number
  zone?: string
}

const host = shallowRef<HostPage | null>(null)
const pageUrl = ref('')
const report = shallowRef<PageReport | null>(null)
const links = ref<LinkResult[] | null>(null)
const checkingLinks = ref(false)

function cleanDocument(document: Document): Document {
  const clone = new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html')
  for (const el of clone.querySelectorAll('[id^="nuxt-devtools"], [class*="nuxt-devtools"]')) el.remove()
  return clone
}

async function refresh() {
  const page = host.value
  if (!page) return
  const url = page.readUrl()
  if (url !== pageUrl.value) links.value = null
  pageUrl.value = url
  report.value = await buildPageReport(cleanDocument(page.document), url)
}

async function fetchZones(): Promise<Record<string, AppZone> | null> {
  try {
    const res = await fetch('/__ranklint/devtools-zones')
    if (!res.ok) return null
    return ((await res.json()) as { apps: Record<string, AppZone> | null }).apps
  } catch {
    return null
  }
}

async function checkLinks() {
  const page = host.value
  if (!page || checkingLinks.value) return
  checkingLinks.value = true
  const apps = await fetchZones()
  const targets = collectInternalLinks(cleanDocument(page.document), pageUrl.value)
  links.value = targets.map(t => ({
    href: t.href,
    count: t.count,
    state: 'pending' as const,
    zone: linkZone(t.href, apps) ?? undefined,
  }))
  const entries = links.value
  const queue = entries.map((_, i) => i)
  const worker = async () => {
    for (let i = queue.shift(); i !== undefined; i = queue.shift()) {
      const entry = entries[i]!
      try {
        let res = await fetch(entry.href, { method: 'HEAD', redirect: 'follow' })
        if (res.status === 405) res = await fetch(entry.href, { method: 'GET', redirect: 'follow' })
        entry.status = res.status
        entry.state = res.status >= 400 ? 'broken' : 'ok'
      } catch {
        entry.state = 'failed'
      }
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker))
  checkingLinks.value = false
}

function scrollToIssue(issue: Issue) {
  if (issue.selector) host.value?.scrollTo(issue.selector)
}

function scrollToHeading(index: number) {
  host.value?.scrollTo('h1, h2, h3, h4, h5, h6', index)
}

function section(title: string, children: VNodeChild): VNodeChild {
  return [h('h2', title), children]
}

function issueList(issues: Issue[]): VNodeChild {
  if (issues.length === 0) return h('p', 'No issues 🎉')
  return issues.map(issue => h('div', {
    class: ['issue', issue.severity, issue.selector ? 'clickable' : ''],
    onClick: () => scrollToIssue(issue),
  }, [
    h('b', issue.checkId),
    ` — ${issue.message}`,
    issue.suggestion ? h('div', { class: 'sg' }, `💡 ${issue.suggestion}`) : null,
  ]))
}

function outlineList(outline: OutlineNode[]): VNodeChild {
  return outline.map((node, i) => h('div', { class: 'h clickable', onClick: () => scrollToHeading(i) }, [
    h('span', { class: 'lvl' }, `H${node.level}`),
    h('span', { class: node.problems.length ? 'bad' : '' }, node.text || '(empty)'),
    ...node.problems.map(p => h('span', { class: 'badge' }, p)),
  ]))
}

function metaTable(meta: Record<string, string>): VNodeChild {
  return h('table', Object.entries(meta).map(([key, value]) =>
    h('tr', [h('td', key), h('td', value)])))
}

function jsonLdList(blocks: JsonLdBlock[]): VNodeChild {
  if (blocks.length === 0) return h('p', 'None')
  return blocks.map(block => h('div', [
    h('b', block.type),
    ' ',
    h('span', { class: ['badge', block.valid ? 'ok' : ''] }, block.valid ? 'valid' : 'invalid'),
    ...block.issues.map(issue => h('div', { class: 'bad' }, `${issue.path} — ${issue.message}`)),
    h('pre', block.raw),
  ]))
}

function linkPanel(): VNodeChild {
  const results = links.value
  if (!results) return h('p', { class: 'dim' }, 'Not checked yet — link check is on demand.')
  const isDead = (r: LinkResult) => r.state === 'broken' || r.state === 'failed'
  const broken = results.filter(r => !r.zone && isDead(r))
  const foreign = results.filter(r => r.zone)
  const foreignBroken = foreign.filter(isDead)
  const summary = `${results.length} internal URLs, ${broken.length} broken`
    + (foreign.length > 0 ? `, ${foreign.length} into other zones` : '')
    + (checkingLinks.value ? ', checking…' : '')
  return [
    h('p', summary),
    ...broken.map(r => h('div', { class: 'issue error' }, [
      h('b', r.status ? `HTTP ${r.status}` : 'unreachable'),
      ` — ${r.href} (${r.count} link${r.count > 1 ? 's' : ''})`,
    ])),
    ...foreignBroken.map(r => h('div', { class: 'issue warn' }, [
      h('b', r.status ? `HTTP ${r.status}` : 'unreachable'),
      ` — ${r.href} (${r.count} link${r.count > 1 ? 's' : ''}) `,
      h('span', { class: 'badge' }, `zone: ${r.zone}`),
      h('div', { class: 'sg' }, 'Owned by another app on this domain — may not be running locally'),
    ])),
  ]
}

const App = defineComponent(() => () => {
  const current = report.value
  if (!host.value) return h('p', 'Waiting for Nuxt DevTools host…')
  if (!current) return h('p', 'Analyzing page…')
  return h('div', [
    h('div', { class: 'bar' }, [
      h('code', { class: 'url' }, new URL(pageUrl.value).pathname + new URL(pageUrl.value).search),
      h('button', { onClick: refresh }, 'Rescan'),
      h('button', { disabled: checkingLinks.value, onClick: checkLinks }, 'Check links'),
    ]),
    section(`Issues (${current.issues.length})`, issueList(current.issues)),
    section('Links', linkPanel()),
    section('Outline', outlineList(current.outline)),
    section('Meta', metaTable(current.meta)),
    section(`JSON-LD (${current.jsonLd.length})`, jsonLdList(current.jsonLd)),
  ])
})

onDevtoolsClientConnected((client) => {
  host.value?.dispose()
  const page = connectHostPage(client)
  if (!page) return
  host.value = page
  page.onChange(() => void refresh())
  void refresh()
})

window.addEventListener('pagehide', () => host.value?.dispose())

createApp(App).mount('#app')

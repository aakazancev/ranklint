import type { AppZone, Issue, PageFetcher, PageSnapshot } from '@ranklint/core'
import { classifyUrl } from '@ranklint/core'
import { level1Checks } from '@ranklint/checks/level1'
import { extractSchemaNodes, validateSchemaNode, type SchemaOrgIssue } from '@ranklint/checks/schema-org'

export interface OutlineNode {
  level: number
  text: string
  problems: string[]
}

export interface JsonLdBlock {
  type: string
  valid: boolean
  issues: SchemaOrgIssue[]
  raw: string
}

export interface PageReport {
  outline: OutlineNode[]
  meta: Record<string, string>
  jsonLd: JsonLdBlock[]
  issues: Issue[]
}

export interface LinkTarget {
  href: string
  count: number
}

const stubFetcher: PageFetcher = {
  fetch: async url => ({ url, html: '', statusCode: 200, headers: {}, ttfb: 0, links: [] }),
  head: async () => ({ statusCode: 200, headers: {} }),
  close: async () => {},
}

function extractOutline(document: Document): OutlineNode[] {
  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
  const h1Count = document.querySelectorAll('h1').length
  const nodes: OutlineNode[] = []
  let prevLevel = 0
  for (const el of headings) {
    const level = Number(el.tagName[1])
    const text = el.textContent?.trim() ?? ''
    const problems: string[] = []
    if (text === '') problems.push('empty')
    if (prevLevel > 0 && level > prevLevel + 1) problems.push(`jump from h${prevLevel}`)
    if (level === 1 && h1Count > 1) problems.push('duplicate h1')
    nodes.push({ level, text, problems })
    prevLevel = level
  }
  return nodes
}

function extractMeta(document: Document): Record<string, string> {
  const meta: Record<string, string> = {}
  const title = document.querySelector('title')?.textContent?.trim()
  if (title) meta.title = title
  for (const el of document.querySelectorAll('meta[name], meta[property]')) {
    const key = el.getAttribute('name') ?? el.getAttribute('property') ?? ''
    if (key === 'description' || key === 'robots' || key.startsWith('og:') || key.startsWith('twitter:')) {
      meta[key] = el.getAttribute('content') ?? ''
    }
  }
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (canonical) meta.canonical = canonical
  for (const el of document.querySelectorAll('link[rel="alternate"][hreflang]')) {
    meta[`hreflang:${el.getAttribute('hreflang')}`] = el.getAttribute('href') ?? ''
  }
  return meta
}

function extractJsonLd(document: Document): JsonLdBlock[] {
  return [...document.querySelectorAll('script[type="application/ld+json"]')].map((el) => {
    const raw = el.textContent ?? ''
    try {
      const nodes = extractSchemaNodes(JSON.parse(raw))
      const issues = nodes.flatMap(node => validateSchemaNode(node))
      const type = nodes.map(node => node.types.join('+')).join(', ') || 'unknown'
      return { type, valid: issues.length === 0, issues, raw }
    } catch {
      return { type: 'invalid', valid: false, issues: [{ path: '(root)', message: 'JSON parse error' }], raw }
    }
  })
}

export function collectInternalLinks(document: Document, pageUrl: string): LinkTarget[] {
  const origin = new URL(pageUrl).origin
  const counts = new Map<string, number>()
  for (const el of document.querySelectorAll('a[href]')) {
    const href = el.getAttribute('href') ?? ''
    if (href.startsWith('#')) continue
    let resolved: URL
    try {
      resolved = new URL(href, pageUrl)
    } catch {
      continue
    }
    if (resolved.origin !== origin || !resolved.protocol.startsWith('http')) continue
    const key = resolved.pathname + resolved.search
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].map(([href, count]) => ({ href, count }))
}

export async function buildPageReport(document: Document, url: string): Promise<PageReport> {
  const snapshot: PageSnapshot = {
    url,
    html: document.documentElement?.outerHTML ?? '',
    statusCode: 200,
    headers: {},
    ttfb: 0,
    links: [],
  }
  const issues: Issue[] = []
  for (const check of level1Checks) {
    try {
      issues.push(...await check.run({
        page: snapshot,
        document,
        config: { severity: check.severity, options: {} },
        site: { url: new URL(url).origin },
        fetcher: stubFetcher,
      }))
    } catch {
      continue
    }
  }
  return {
    outline: extractOutline(document),
    meta: extractMeta(document),
    jsonLd: extractJsonLd(document),
    issues,
  }
}

export function linkZone(href: string, apps?: Record<string, AppZone> | null): string | null {
  if (!apps) return null
  const cls = classifyUrl(href, { siteUrl: 'http://ranklint.local', apps })
  return cls.action === 'reachability' ? cls.zone : null
}

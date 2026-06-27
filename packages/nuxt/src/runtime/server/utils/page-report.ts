import type { Issue, PageFetcher, PageSnapshot } from '@ranklint/core'
import {
  allChecks,
  validateSchemaOrg,
  type SchemaOrgIssue,
} from '@ranklint/checks'
import { parseHTML } from 'linkedom'

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

const NETWORK_CHECKS = new Set(['canonical:valid', 'links:no-broken', 'links:no-redirect-chain'])

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
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const type = String(parsed['@type'] ?? 'unknown')
      const issues = validateSchemaOrg(type, parsed)
      return { type, valid: issues.length === 0, issues, raw }
    } catch {
      return { type: 'invalid', valid: false, issues: [{ path: '(root)', message: 'JSON parse error' }], raw }
    }
  })
}

export async function buildPageReport(html: string, url: string): Promise<PageReport> {
  const { document } = parseHTML(html)
  const doc = document as unknown as Document
  const snapshot: PageSnapshot = { url, html, statusCode: 200, headers: {}, ttfb: 0, links: [] }
  const issues: Issue[] = []
  for (const check of allChecks) {
    if (check.scope !== 'page' || NETWORK_CHECKS.has(check.id)) continue
    try {
      issues.push(...await check.run({
        page: snapshot,
        document: doc,
        config: { severity: check.severity, options: {} },
        site: { url: new URL(url).origin },
        fetcher: stubFetcher,
      }))
    } catch {
      continue
    }
  }
  return {
    outline: extractOutline(doc),
    meta: extractMeta(doc),
    jsonLd: extractJsonLd(doc),
    issues,
  }
}

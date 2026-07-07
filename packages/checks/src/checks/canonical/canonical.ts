import type { Issue } from '@ranklint/core'
import { getDocument } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'
import { resolveUrl } from '../../net'

function canonicalHref(doc: Document | undefined): string {
  return doc?.querySelector('link[rel="canonical"]')?.getAttribute('href')?.trim() ?? ''
}

export const canonicalRequired = defineCheck({
  id: 'canonical:required',
  category: 'meta',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('canonical:required'),
  async run(ctx) {
    if (canonicalHref(ctx.document)) return []
    return [{
      checkId: 'canonical:required',
      severity: 'error',
      message: 'Page has no canonical link',
      url: ctx.page!.url,
      selector: 'head',
      suggestion: 'Add <link rel="canonical"> via useHead({ link: [{ rel: "canonical", href }] })',
      docs: docsUrl('canonical:required'),
    }]
  },
})

export const canonicalValid = defineCheck({
  id: 'canonical:valid',
  category: 'meta',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('canonical:valid'),
  async run(ctx) {
    const href = canonicalHref(ctx.document)
    if (!href) return []
    let target: URL
    try {
      target = new URL(href)
    } catch {
      return [{
        checkId: 'canonical:valid',
        severity: 'error',
        message: `Canonical "${href}" is not an absolute URL`,
        url: ctx.page!.url,
        selector: 'link[rel="canonical"]',
        suggestion: 'Use an absolute URL including origin, e.g. https://example.com/page',
        docs: docsUrl('canonical:valid'),
      }]
    }
    const { status, hops } = await resolveUrl(ctx.fetcher, target.toString())
    if (hops > 0) {
      return [{
        checkId: 'canonical:valid',
        severity: 'error',
        message: `Canonical "${href}" points to a redirect`,
        url: ctx.page!.url,
        selector: 'link[rel="canonical"]',
        suggestion: 'Point canonical directly at the final URL',
        docs: docsUrl('canonical:valid'),
      }]
    }
    if (status !== 200) {
      return [{
        checkId: 'canonical:valid',
        severity: 'error',
        message: `Canonical "${href}" responds with ${status}`,
        url: ctx.page!.url,
        selector: 'link[rel="canonical"]',
        suggestion: 'Canonical must point to a live page answering 200',
        docs: docsUrl('canonical:valid'),
      }]
    }
    return []
  },
})

function canonicalPathOf(page: { url: string }, doc: Document): string | null {
  const href = canonicalHref(doc)
  if (!href) return null
  try {
    return new URL(href, page.url).pathname
  } catch {
    return null
  }
}

export const canonicalNoChain = defineCheck({
  id: 'canonical:no-chain',
  category: 'meta',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('canonical:no-chain'),
  async run(ctx) {
    const pages = ctx.pages ?? []
    const canonicalByPath = new Map<string, string>()
    for (const page of pages) {
      const canon = canonicalPathOf(page, getDocument(page))
      if (canon) canonicalByPath.set(new URL(page.url).pathname, canon)
    }
    const issues: Issue[] = []
    for (const page of pages) {
      const path = new URL(page.url).pathname
      const canon = canonicalByPath.get(path)
      if (!canon || canon === path) continue
      const next = canonicalByPath.get(canon)
      if (!next || next === canon) continue
      issues.push({
        checkId: 'canonical:no-chain',
        severity: 'warn',
        message: `Canonical points to "${canon}" which canonicalizes further to "${next}"`,
        url: page.url,
        selector: 'link[rel="canonical"]',
        suggestion: `Point the canonical directly at "${next}" — chained canonicals dilute the signal`,
        docs: docsUrl('canonical:no-chain'),
      })
    }
    return issues
  },
})

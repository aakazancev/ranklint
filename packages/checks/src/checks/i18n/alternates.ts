import type { PageSnapshot } from '@ranklint/core'
import { getDocument } from '@ranklint/core'

export interface Alternate {
  hreflang: string
  href: string
}

export function alternates(doc: Document): Alternate[] {
  return [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(el => ({
    hreflang: el.getAttribute('hreflang') ?? '',
    href: el.getAttribute('href') ?? '',
  }))
}

export function pathOf(url: string, base: string): string | null {
  try {
    return new URL(url, base).pathname
  } catch {
    return null
  }
}

export function mutualAlternates(
  pages: PageSnapshot[],
  siteUrl: string,
): Map<string, Set<string>> {
  const targets = new Map<string, Set<string>>()
  for (const page of pages) {
    const path = pathOf(page.url, siteUrl)
    if (!path) continue
    const set = new Set<string>()
    for (const alt of alternates(getDocument(page))) {
      const target = pathOf(alt.href, siteUrl)
      if (target && target !== path) set.add(target)
    }
    targets.set(path, set)
  }
  const mutual = new Map<string, Set<string>>()
  for (const [path, set] of targets) {
    const partners = new Set<string>()
    for (const target of set) {
      if (targets.get(target)?.has(path)) partners.add(target)
    }
    mutual.set(path, partners)
  }
  return mutual
}

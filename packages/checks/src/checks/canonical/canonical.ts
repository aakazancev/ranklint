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

import type { Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

function metaContent(doc: Document, property: string): string | null {
  return doc.querySelector(`meta[property="${property}"], meta[name="${property}"]`)?.getAttribute('content') ?? null
}

const TWITTER_CARDS = new Set(['summary', 'summary_large_image', 'app', 'player'])

export const ogRequired = defineCheck({
  id: 'meta:og-required',
  category: 'meta',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('meta:og-required'),
  async run(ctx) {
    const doc = ctx.document!
    const issues: Issue[] = []
    const push = (message: string, suggestion: string, selector = 'head') => issues.push({
      checkId: 'meta:og-required',
      severity: 'warn',
      message,
      url: ctx.page!.url,
      selector,
      suggestion,
      docs: docsUrl('meta:og-required'),
    })
    const missing: { tag: string, key: string }[] = []
    if (!metaContent(doc, 'og:title')) missing.push({ tag: 'og:title', key: 'ogTitle' })
    if (!metaContent(doc, 'og:description')) missing.push({ tag: 'og:description', key: 'ogDescription' })
    const image = metaContent(doc, 'og:image')
    if (!image) missing.push({ tag: 'og:image', key: 'ogImage' })
    if (missing.length > 0) {
      push(
        `Page has no ${missing.map(m => m.tag).join(', ')}`,
        `Add ${missing.map(m => m.tag).join(', ')} via useSeoMeta({ ${missing.map(m => m.key).join(', ')} }) — social shares fall back to arbitrary text and get less engagement without them`,
      )
    }
    if (image && !/^https?:\/\//.test(image)) {
      push(
        `og:image must be an absolute URL, got "${image}"`,
        'Social crawlers do not resolve relative og:image URLs — use the full https:// address',
        'meta[property="og:image"]',
      )
    }
    return issues
  },
})

export const twitterCard = defineCheck({
  id: 'meta:twitter-card',
  category: 'meta',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('meta:twitter-card'),
  async run(ctx) {
    const doc = ctx.document!
    const card = metaContent(doc, 'twitter:card')
    if (card === null) return []
    const issues: Issue[] = []
    if (!TWITTER_CARDS.has(card)) {
      issues.push({
        checkId: 'meta:twitter-card',
        severity: 'warn',
        message: `Unknown twitter:card value "${card}" (valid: ${[...TWITTER_CARDS].join(', ')})`,
        url: ctx.page!.url,
        selector: 'meta[name="twitter:card"]',
        suggestion: 'Use one of the documented card types or the card is ignored',
        docs: docsUrl('meta:twitter-card'),
      })
    }
    if (card === 'summary_large_image' && !metaContent(doc, 'twitter:image') && !metaContent(doc, 'og:image')) {
      issues.push({
        checkId: 'meta:twitter-card',
        severity: 'warn',
        message: 'twitter:card is summary_large_image but neither twitter:image nor og:image is set',
        url: ctx.page!.url,
        selector: 'meta[name="twitter:card"]',
        suggestion: 'Large-image cards need an image; add twitter:image or og:image',
        docs: docsUrl('meta:twitter-card'),
      })
    }
    return issues
  },
})

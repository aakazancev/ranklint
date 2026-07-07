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
    const title = metaContent(doc, 'og:title')
    const description = metaContent(doc, 'og:description')
    const image = metaContent(doc, 'og:image')
    if (!title) push('Page has no og:title', 'Add og:title — social shares fall back to arbitrary text without it')
    if (!description) push('Page has no og:description', 'Add og:description for the share snippet')
    if (!image) {
      push('Page has no og:image', 'Add og:image — links without an image get drastically less engagement')
    } else if (!/^https?:\/\//.test(image)) {
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

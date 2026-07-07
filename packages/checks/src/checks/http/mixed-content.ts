import type { Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

const RESOURCES = 'img[src], script[src], iframe[src], video[src], audio[src], source[src], link[rel="stylesheet"][href]'

export const noMixedContent = defineCheck({
  id: 'http:no-mixed-content',
  category: 'http',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('http:no-mixed-content'),
  async run(ctx) {
    if (!ctx.page!.url.startsWith('https://')) return []
    const issues: Issue[] = []
    for (const el of ctx.document!.querySelectorAll(RESOURCES)) {
      const attr = el.hasAttribute('src') ? 'src' : 'href'
      const value = el.getAttribute(attr) ?? ''
      if (!value.startsWith('http://')) continue
      issues.push({
        checkId: 'http:no-mixed-content',
        severity: 'error',
        message: `Insecure ${el.tagName.toLowerCase()} resource on an https page: ${value}`,
        url: ctx.page!.url,
        selector: `${el.tagName.toLowerCase()}[${attr}="${value}"]`,
        suggestion: 'Browsers block or downgrade mixed content — serve the resource over https',
        docs: docsUrl('http:no-mixed-content'),
      })
    }
    return issues
  },
})

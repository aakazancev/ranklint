import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

function headings(doc: Document | undefined): { level: number, text: string }[] {
  if (!doc) return []
  return [...doc.querySelectorAll('h1, h2, h3, h4, h5, h6')].map(el => ({
    level: Number(el.tagName[1]),
    text: el.textContent?.trim() ?? '',
  }))
}

export const singleH1 = defineCheck({
  id: 'headings:single-h1',
  category: 'headings',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('headings:single-h1'),
  async run(ctx) {
    const count = ctx.document?.querySelectorAll('h1').length ?? 0
    if (count === 1) return []
    return [{
      checkId: 'headings:single-h1',
      severity: 'error',
      message: `Page has ${count} <h1> elements, expected exactly 1`,
      url: ctx.page!.url,
      selector: 'h1',
      suggestion: count === 0
        ? 'Add a single <h1> describing the page topic'
        : 'Keep one <h1>, demote the rest to <h2>',
      docs: docsUrl('headings:single-h1'),
    }]
  },
})

export const noEmpty = defineCheck({
  id: 'headings:no-empty',
  category: 'headings',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('headings:no-empty'),
  async run(ctx) {
    return headings(ctx.document)
      .filter(h => h.text === '')
      .map(h => ({
        checkId: 'headings:no-empty',
        severity: 'warn' as const,
        message: `Empty <h${h.level}> element`,
        url: ctx.page!.url,
        selector: `h${h.level}`,
        suggestion: 'Remove the empty heading or fill it with text',
        docs: docsUrl('headings:no-empty'),
      }))
  },
})

export const hierarchy = defineCheck({
  id: 'headings:hierarchy',
  category: 'headings',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('headings:hierarchy'),
  async run(ctx) {
    const all = headings(ctx.document)
    const issues = []
    for (let i = 1; i < all.length; i++) {
      const prev = all[i - 1]!
      const curr = all[i]!
      if (curr.level > prev.level + 1) {
        issues.push({
          checkId: 'headings:hierarchy',
          severity: 'warn' as const,
          message: `Heading level jumps from h${prev.level} to h${curr.level}`,
          url: ctx.page!.url,
          selector: `h${curr.level}`,
          suggestion: `Use h${prev.level + 1} instead of h${curr.level} to keep the outline continuous`,
          docs: docsUrl('headings:hierarchy'),
        })
      }
    }
    return issues
  },
})

export const h1Length = defineCheck({
  id: 'headings:h1-length',
  category: 'headings',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('headings:h1-length'),
  optionsSchema: z.object({
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  }),
  async run(ctx) {
    const { min = 20, max = 70 } = ctx.config.options as { min?: number, max?: number }
    const text = ctx.document?.querySelector('h1')?.textContent?.trim() ?? ''
    if (!text) return []
    if (text.length >= min && text.length <= max) return []
    return [{
      checkId: 'headings:h1-length',
      severity: 'warn',
      message: `H1 is ${text.length} chars, expected ${min}–${max}`,
      url: ctx.page!.url,
      selector: 'h1',
      suggestion: text.length < min
        ? `Expand the H1 to at least ${min} chars so it describes the page`
        : `Shorten the H1 to ${max} chars or less`,
      docs: docsUrl('headings:h1-length'),
    }]
  },
})

import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

function pageTitle(doc: Document | undefined): string {
  return doc?.querySelector('title')?.textContent?.trim() ?? ''
}

export const titleRequired = defineCheck({
  id: 'meta:title-required',
  category: 'meta',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('meta:title-required'),
  async run(ctx) {
    if (pageTitle(ctx.document)) return []
    return [{
      checkId: 'meta:title-required',
      severity: 'error',
      message: 'Page has no <title>',
      url: ctx.page!.url,
      selector: 'head',
      suggestion: 'Add a descriptive <title> via useHead({ title })',
      docs: docsUrl('meta:title-required'),
    }]
  },
})

export const titleLength = defineCheck({
  id: 'meta:title-length',
  category: 'meta',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('meta:title-length'),
  optionsSchema: z.object({
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  }),
  async run(ctx) {
    const { min = 30, max = 60 } = ctx.config.options as { min?: number, max?: number }
    const title = pageTitle(ctx.document)
    if (!title) return []
    if (title.length >= min && title.length <= max) return []
    return [{
      checkId: 'meta:title-length',
      severity: 'warn',
      message: `Title is ${title.length} chars, expected ${min}–${max}`,
      url: ctx.page!.url,
      selector: 'title',
      suggestion: title.length < min
        ? `Expand the title to at least ${min} chars so it is descriptive in SERP`
        : `Shorten the title to ${max} chars or less so it is not cut off in SERP`,
      docs: docsUrl('meta:title-length'),
    }]
  },
})

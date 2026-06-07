import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

function pageDescription(doc: Document | undefined): string {
  return doc?.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? ''
}

export const descriptionRequired = defineCheck({
  id: 'meta:description-required',
  category: 'meta',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('meta:description-required'),
  async run(ctx) {
    if (pageDescription(ctx.document)) return []
    return [{
      checkId: 'meta:description-required',
      severity: 'error',
      message: 'Page has no meta description',
      url: ctx.page!.url,
      selector: 'head',
      suggestion: 'Add <meta name="description"> via useSeoMeta({ description })',
      docs: docsUrl('meta:description-required'),
    }]
  },
})

export const descriptionLength = defineCheck({
  id: 'meta:description-length',
  category: 'meta',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('meta:description-length'),
  optionsSchema: z.object({
    min: z.number().int().positive().optional(),
    max: z.number().int().positive().optional(),
  }),
  async run(ctx) {
    const { min = 70, max = 160 } = ctx.config.options as { min?: number, max?: number }
    const description = pageDescription(ctx.document)
    if (!description) return []
    if (description.length >= min && description.length <= max) return []
    return [{
      checkId: 'meta:description-length',
      severity: 'warn',
      message: `Meta description is ${description.length} chars, expected ${min}–${max}`,
      url: ctx.page!.url,
      selector: 'meta[name="description"]',
      suggestion: description.length < min
        ? `Expand the description to at least ${min} chars to improve SERP snippet`
        : `Shorten the description to ${max} chars or less, search engines truncate the rest`,
      docs: docsUrl('meta:description-length'),
    }]
  },
})

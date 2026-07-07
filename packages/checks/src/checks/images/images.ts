import type { Issue } from '@ranklint/core'
import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'

function images(doc: Document): Element[] {
  return [...doc.querySelectorAll('img')]
}

function selectorFor(img: Element): string {
  const src = img.getAttribute('src') ?? ''
  return src ? `img[src="${src}"]` : 'img'
}

export const altRequired = defineCheck({
  id: 'images:alt-required',
  category: 'images',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('images:alt-required'),
  async run(ctx) {
    return images(ctx.document!)
      .filter(img => img.getAttribute('alt') === null)
      .map((img): Issue => ({
        checkId: 'images:alt-required',
        severity: 'warn',
        message: 'Image has no alt attribute',
        url: ctx.page!.url,
        selector: selectorFor(img),
        suggestion: 'Add a descriptive alt, or alt="" for purely decorative images',
        docs: docsUrl('images:alt-required'),
      }))
  },
})

export const dimensionsRequired = defineCheck({
  id: 'images:dimensions-required',
  category: 'images',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('images:dimensions-required'),
  async run(ctx) {
    return images(ctx.document!)
      .filter(img => !img.getAttribute('width') || !img.getAttribute('height'))
      .map((img): Issue => ({
        checkId: 'images:dimensions-required',
        severity: 'warn',
        message: 'Image has no explicit width/height',
        url: ctx.page!.url,
        selector: selectorFor(img),
        suggestion: 'Set width and height so the browser reserves space and avoids CLS',
        docs: docsUrl('images:dimensions-required'),
      }))
  },
})

export const noLazyAboveFold = defineCheck({
  id: 'images:no-lazy-above-fold',
  category: 'images',
  severity: 'warn',
  scope: 'page',
  docs: docsUrl('images:no-lazy-above-fold'),
  optionsSchema: z.object({
    firstImages: z.number().int().positive().optional(),
  }),
  async run(ctx) {
    const { firstImages = 3 } = ctx.config.options as { firstImages?: number }
    const aboveFold = ctx.page!.aboveFoldImages
    const candidates = aboveFold
      ? images(ctx.document!).filter(img => aboveFold.includes(img.getAttribute('src') ?? ''))
      : images(ctx.document!).slice(0, firstImages)
    return candidates
      .filter(img => img.getAttribute('loading') === 'lazy')
      .map((img): Issue => ({
        checkId: 'images:no-lazy-above-fold',
        severity: 'warn',
        message: aboveFold
          ? 'Image in the viewport uses loading="lazy"'
          : `One of the first ${firstImages} images uses loading="lazy"`,
        url: ctx.page!.url,
        selector: selectorFor(img),
        suggestion: 'Above-the-fold images should load eagerly; lazy-loading them delays LCP',
        docs: docsUrl('images:no-lazy-above-fold'),
      }))
  },
})

import type { Check } from '@ranklint/core'
import type { z } from 'zod'

export interface CheckDefinition extends Check {
  docs: string
  optionsSchema?: z.ZodType
}

export function defineCheck(definition: CheckDefinition): CheckDefinition {
  return definition
}

const DOCS_BASE = 'https://ranklint.dev'

const CATEGORY_BY_PREFIX: Record<string, string> = {
  meta: 'meta',
  canonical: 'meta',
  headings: 'headings',
  links: 'links',
  hreflang: 'i18n',
  i18n: 'i18n',
  jsonld: 'structured-data',
  images: 'images',
  robots: 'robots',
  sitemap: 'indexability',
  indexability: 'indexability',
  http: 'http',
  mobile: 'http',
}

export function docsUrl(id: string): string {
  const prefix = id.split(':')[0]!
  const category = CATEGORY_BY_PREFIX[prefix] ?? prefix
  return `${DOCS_BASE}/en/rules/${category}/${id.replace(/:/g, '-')}`
}

import type { Issue } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'
import { validateSchemaOrg } from '../../schema-org'

function blocks(doc: Document): string[] {
  return [...doc.querySelectorAll('script[type="application/ld+json"]')]
    .map(el => el.textContent ?? '')
}

export const jsonldParseable = defineCheck({
  id: 'jsonld:parseable',
  category: 'structured-data',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('jsonld:parseable'),
  async run(ctx) {
    const issues: Issue[] = []
    for (const raw of blocks(ctx.document!)) {
      try {
        JSON.parse(raw)
      } catch (e) {
        issues.push({
          checkId: 'jsonld:parseable',
          severity: 'error',
          message: `JSON-LD block is not valid JSON: ${e instanceof Error ? e.message : String(e)}`,
          url: ctx.page!.url,
          selector: 'script[type="application/ld+json"]',
          suggestion: 'Fix the JSON syntax; search engines silently ignore broken JSON-LD',
          docs: docsUrl('jsonld:parseable'),
        })
      }
    }
    return issues
  },
})

export const jsonldValidSchema = defineCheck({
  id: 'jsonld:valid-schema',
  category: 'structured-data',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('jsonld:valid-schema'),
  async run(ctx) {
    const issues: Issue[] = []
    for (const raw of blocks(ctx.document!)) {
      let parsed: Record<string, unknown>
      try {
        parsed = JSON.parse(raw) as Record<string, unknown>
      } catch {
        continue
      }
      const type = String(parsed['@type'] ?? '')
      if (!type) continue
      for (const problem of validateSchemaOrg(type, parsed)) {
        issues.push({
          checkId: 'jsonld:valid-schema',
          severity: 'error',
          message: `JSON-LD ${type}: ${problem.path} — ${problem.message}`,
          url: ctx.page!.url,
          selector: 'script[type="application/ld+json"]',
          suggestion: 'Fill the required schema.org fields so rich results are eligible',
          docs: docsUrl('jsonld:valid-schema'),
        })
      }
    }
    return issues
  },
})

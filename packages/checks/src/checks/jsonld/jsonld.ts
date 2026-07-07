import type { Issue } from '@ranklint/core'
import { z } from 'zod'
import { defineCheck, docsUrl } from '../../define'
import { extractSchemaNodes, validateSchemaNode, type SchemaMap } from '../../schema-org'

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

const schemaMapSchema = z.custom<SchemaMap>((value) => {
  if (typeof value !== 'object' || value === null) return false
  return Object.values(value).every(schema =>
    typeof schema === 'object' && schema !== null && 'safeParse' in schema)
}, 'schemas must map type names to zod schemas')

export const jsonldValidSchema = defineCheck({
  id: 'jsonld:valid-schema',
  category: 'structured-data',
  severity: 'error',
  scope: 'page',
  docs: docsUrl('jsonld:valid-schema'),
  optionsSchema: z.object({
    schemas: schemaMapSchema.optional(),
  }),
  async run(ctx) {
    const customSchemas = (ctx.config.options as { schemas?: SchemaMap }).schemas ?? {}
    const issues: Issue[] = []
    for (const raw of blocks(ctx.document!)) {
      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        continue
      }
      for (const node of extractSchemaNodes(parsed)) {
        const label = node.types.join('+')
        for (const problem of validateSchemaNode(node, customSchemas)) {
          issues.push({
            checkId: 'jsonld:valid-schema',
            severity: 'error',
            message: `JSON-LD ${label}: ${problem.path} — ${problem.message}`,
            url: ctx.page!.url,
            selector: 'script[type="application/ld+json"]',
            suggestion: 'Fill the required schema.org fields so rich results are eligible',
            docs: docsUrl('jsonld:valid-schema'),
          })
        }
      }
    }
    return issues
  },
})

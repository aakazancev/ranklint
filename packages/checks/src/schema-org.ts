import { z } from 'zod'

export const schemaOrgSchemas = {
  Product: z.looseObject({
    name: z.string().min(1),
    image: z.union([z.string(), z.array(z.string())]).optional(),
    offers: z.looseObject({ price: z.union([z.string(), z.number()]), priceCurrency: z.string() }).optional(),
  }),
  Article: z.looseObject({
    headline: z.string().min(1),
    datePublished: z.string().optional(),
    author: z.unknown().optional(),
  }),
  BreadcrumbList: z.looseObject({
    itemListElement: z.array(z.looseObject({
      '@type': z.literal('ListItem').optional(),
      'position': z.number(),
      'name': z.string().optional(),
      'item': z.unknown().optional(),
    })).min(1),
  }),
  Organization: z.looseObject({
    name: z.string().min(1),
    url: z.string().optional(),
    logo: z.string().optional(),
  }),
  WebSite: z.looseObject({
    name: z.string().min(1),
    url: z.string().min(1),
  }),
  BlogPosting: z.looseObject({
    headline: z.string().min(1),
    datePublished: z.string().optional(),
    author: z.unknown().optional(),
  }),
  FAQPage: z.looseObject({
    mainEntity: z.array(z.looseObject({
      '@type': z.literal('Question').optional(),
      'name': z.string().min(1),
      'acceptedAnswer': z.looseObject({ text: z.string().min(1) }),
    })).min(1),
  }),
  Event: z.looseObject({
    name: z.string().min(1),
    startDate: z.string().min(1),
    location: z.unknown().optional(),
  }),
  LocalBusiness: z.looseObject({
    name: z.string().min(1),
    address: z.unknown(),
  }),
  Recipe: z.looseObject({
    name: z.string().min(1),
    recipeIngredient: z.array(z.string()).optional(),
    recipeInstructions: z.unknown().optional(),
  }),
  JobPosting: z.looseObject({
    title: z.string().min(1),
    hiringOrganization: z.unknown(),
    datePosted: z.string().optional(),
  }),
} as const

export type SchemaOrgType = keyof typeof schemaOrgSchemas

export type SchemaMap = Record<string, z.ZodType>

export interface SchemaOrgIssue {
  path: string
  message: string
}

export interface SchemaNode {
  types: string[]
  data: Record<string, unknown>
}

export function extractSchemaNodes(parsed: unknown): SchemaNode[] {
  if (Array.isArray(parsed)) return parsed.flatMap(extractSchemaNodes)
  if (typeof parsed !== 'object' || parsed === null) return []
  const record = parsed as Record<string, unknown>
  if (Array.isArray(record['@graph'])) return record['@graph'].flatMap(extractSchemaNodes)
  const rawType = record['@type']
  const types = (Array.isArray(rawType) ? rawType : [rawType])
    .filter((t): t is string => typeof t === 'string' && t !== '')
  if (types.length === 0) return []
  return [{ types, data: record }]
}

export function validateSchemaOrg(
  type: string,
  data: Record<string, unknown>,
  customSchemas: SchemaMap = {},
): SchemaOrgIssue[] {
  const schema = customSchemas[type] ?? schemaOrgSchemas[type as SchemaOrgType]
  if (!schema) {
    const known = [...Object.keys(schemaOrgSchemas), ...Object.keys(customSchemas)]
    return [{ path: '@type', message: `Unknown schema.org type "${type}" (known: ${known.join(', ')})` }]
  }
  const parsed = schema.safeParse(data)
  if (parsed.success) return []
  return parsed.error.issues.map(issue => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

export function validateSchemaNode(node: SchemaNode, customSchemas: SchemaMap = {}): SchemaOrgIssue[] {
  const known = node.types.filter(t => t in schemaOrgSchemas || t in customSchemas)
  if (known.length === 0) {
    return node.types.length === 1 ? validateSchemaOrg(node.types[0]!, node.data, customSchemas) : []
  }
  return known.flatMap(type => validateSchemaOrg(type, node.data, customSchemas))
}

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
} as const

export type SchemaOrgType = keyof typeof schemaOrgSchemas

export interface SchemaOrgIssue {
  path: string
  message: string
}

export function validateSchemaOrg(type: string, data: Record<string, unknown>): SchemaOrgIssue[] {
  const schema = schemaOrgSchemas[type as SchemaOrgType]
  if (!schema) {
    return [{ path: '@type', message: `Unknown schema.org type "${type}" (known: ${Object.keys(schemaOrgSchemas).join(', ')})` }]
  }
  const parsed = schema.safeParse(data)
  if (parsed.success) return []
  return parsed.error.issues.map(issue => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
  }))
}

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { jsonldValidSchema } from '../src/checks/jsonld/jsonld'
import { extractSchemaNodes, validateSchemaNode, validateSchemaOrg } from '../src/schema-org'
import { runCheckOnHtml } from '../src/test-utils'

describe('validateSchemaOrg', () => {
  it('passes valid Product and allows extra fields', () => {
    expect(validateSchemaOrg('Product', {
      name: 'Widget',
      sku: 'W-1',
      offers: { price: 9.99, priceCurrency: 'USD' },
    })).toEqual([])
  })

  it('reports missing required fields with paths', () => {
    const issues = validateSchemaOrg('Article', {})
    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toBe('headline')
  })

  it('validates nested structures', () => {
    const issues = validateSchemaOrg('BreadcrumbList', { itemListElement: [{ name: 'Home' }] })
    expect(issues[0]?.path).toContain('position')
  })

  it('rejects unknown types with a hint', () => {
    const issues = validateSchemaOrg('SpaceStation', {})
    expect(issues[0]?.message).toContain('Unknown schema.org type')
  })
})

describe('new schema.org types', () => {
  it('validates FAQPage questions', () => {
    expect(validateSchemaOrg('FAQPage', {
      mainEntity: [{ name: 'Q?', acceptedAnswer: { text: 'A.' } }],
    })).toEqual([])
    const broken = validateSchemaOrg('FAQPage', { mainEntity: [{ name: 'Q?' }] })
    expect(broken[0]?.path).toBe('mainEntity.0.acceptedAnswer')
  })

  it('validates Event, LocalBusiness, Recipe, JobPosting, BlogPosting', () => {
    expect(validateSchemaOrg('Event', { name: 'Conf', startDate: '2026-09-01' })).toEqual([])
    expect(validateSchemaOrg('Event', { name: 'Conf' })[0]?.path).toBe('startDate')
    expect(validateSchemaOrg('LocalBusiness', { name: 'Shop', address: 'Main st. 1' })).toEqual([])
    expect(validateSchemaOrg('Recipe', { name: 'Borscht' })).toEqual([])
    expect(validateSchemaOrg('JobPosting', { title: 'Dev', hiringOrganization: { name: 'Acme' } })).toEqual([])
    expect(validateSchemaOrg('BlogPosting', { headline: 'Post' })).toEqual([])
  })
})

describe('extractSchemaNodes', () => {
  it('unwraps @graph containers and arrays', () => {
    const nodes = extractSchemaNodes({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', 'name': 'Acme' },
        { '@type': 'WebSite', 'name': 'Acme', 'url': 'https://acme.com' },
      ],
    })
    expect(nodes.map(n => n.types)).toEqual([['Organization'], ['WebSite']])
  })

  it('keeps multi-type arrays and skips typeless nodes', () => {
    expect(extractSchemaNodes({ '@type': ['Product', 'Vehicle'], 'name': 'Car' })[0]?.types).toEqual(['Product', 'Vehicle'])
    expect(extractSchemaNodes({ name: 'no type' })).toEqual([])
  })
})

describe('validateSchemaNode', () => {
  it('validates known types from a multi-type node and skips fully unknown multi-types', () => {
    expect(validateSchemaNode({ types: ['Product', 'Vehicle'], data: { name: 'Car' } })).toEqual([])
    expect(validateSchemaNode({ types: ['Product', 'Vehicle'], data: {} })[0]?.path).toBe('name')
    expect(validateSchemaNode({ types: ['Vehicle', 'Boat'], data: {} })).toEqual([])
    expect(validateSchemaNode({ types: ['Vehicle'], data: {} })[0]?.path).toBe('@type')
  })

  it('accepts custom schemas', () => {
    const custom = { Vehicle: z.looseObject({ vin: z.string().min(1) }) }
    expect(validateSchemaNode({ types: ['Vehicle'], data: { vin: 'X1' } }, custom)).toEqual([])
    expect(validateSchemaNode({ types: ['Vehicle'], data: {} }, custom)[0]?.path).toBe('vin')
  })
})

describe('jsonld:valid-schema with graphs and custom schemas', () => {
  const page = (json: string) =>
    `<html><head><script type="application/ld+json">${json}</script></head><body></body></html>`

  it('validates every node inside @graph', async () => {
    const issues = await runCheckOnHtml(jsonldValidSchema, page(JSON.stringify({
      '@graph': [
        { '@type': 'Organization', 'name': 'Acme' },
        { '@type': 'FAQPage', 'mainEntity': [] },
      ],
    })))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('FAQPage')
  })

  it('uses custom schemas from rule options', async () => {
    const html = page(JSON.stringify({ '@type': 'Vehicle', 'name': 'Car' }))
    const withCustom = await runCheckOnHtml(jsonldValidSchema, html, {
      options: { schemas: { Vehicle: z.looseObject({ vin: z.string() }) } },
    })
    expect(withCustom[0]?.message).toContain('vin')
    const withoutCustom = await runCheckOnHtml(jsonldValidSchema, html)
    expect(withoutCustom[0]?.message).toContain('Unknown schema.org type')
  })
})

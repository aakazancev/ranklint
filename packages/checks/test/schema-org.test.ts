import { describe, expect, it } from 'vitest'
import { validateSchemaOrg } from '../src/schema-org'

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
    const issues = validateSchemaOrg('Recipe', {})
    expect(issues[0]?.message).toContain('Unknown schema.org type')
  })
})

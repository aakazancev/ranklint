import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const locales = ['en', 'ru'] as const

function messages(locale: string) {
  return JSON.parse(readFileSync(`${root}docs/i18n/locales/${locale}.json`, 'utf8')) as {
    landing: { meta: { title: string, description: string } }
  }
}

describe.each(locales)('landing seo strings (%s)', (locale) => {
  const { title, description } = messages(locale).landing.meta

  it('has a title of at most 60 characters', () => {
    expect(title.length).toBeGreaterThan(0)
    expect(title.length).toBeLessThanOrEqual(60)
  })

  it('has a description between 70 and 155 characters', () => {
    expect(description.length).toBeGreaterThanOrEqual(70)
    expect(description.length).toBeLessThanOrEqual(155)
  })

  it('uses no em or en dashes', () => {
    expect(title).not.toMatch(/[–—]/)
    expect(description).not.toMatch(/[–—]/)
  })

  it('leaves the brand to the title template', () => {
    expect(title.toLowerCase()).not.toContain('ranklint')
  })
})

describe.each(locales)('landing messages (%s)', (locale) => {
  const landing = messages(locale).landing as unknown as Record<string, unknown>

  it('carries every section the page renders', () => {
    const sections = ['nav', 'hero', 'facts', 'pillars', 'demo', 'devtools', 'rules', 'ci', 'stack', 'monitor', 'seotext', 'faq', 'cta', 'footer']
    expect(sections.filter(key => !(key in landing))).toEqual([])
  })
})

describe('landing messages match across locales', () => {
  function keys(value: unknown, prefix = ''): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix]
    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
      keys(child, prefix ? `${prefix}.${key}` : key))
  }

  it('uses the same key set in en and ru', () => {
    expect(keys(messages('ru').landing)).toEqual(keys(messages('en').landing))
  })
})

describe('rules index', () => {
  const index = JSON.parse(readFileSync(`${root}docs/rules-index.json`, 'utf8')) as {
    total: number
    groups: { folder: string, count: number, first: string }[]
  }

  it('has a total equal to the sum of group counts', () => {
    expect(index.groups.reduce((sum, group) => sum + group.count, 0)).toBe(index.total)
  })

  it.each(locales)('points every group at an existing page in %s', (locale) => {
    const missing = index.groups
      .map(group => `docs/content/${locale}/6.rules${group.first.replace(/^\/rules/, '')}.md`)
      .filter(path => !existsSync(`${root}${path}`))
    expect(missing).toEqual([])
  })
})

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const locales = ['en', 'ru'] as const

function seo(locale: string) {
  const source = readFileSync(`${root}docs/content/${locale}/index.md`, 'utf8')
  const frontmatter = source.split('---')[1] ?? ''
  const read = (key: string) => {
    const value = frontmatter.match(new RegExp(`^\\s+${key}:\\s*(.*)$`, 'm'))?.[1] ?? ''
    return value.trim().replace(/^["']|["']$/g, '')
  }
  return { title: read('title'), description: read('description') }
}

describe.each(locales)('landing seo frontmatter (%s)', (locale) => {
  const { title, description } = seo(locale)

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

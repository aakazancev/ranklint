import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildRulesIndex, mergeGenerated } from '../scripts/generate-rules-doc.mjs'

const generated = '<!-- generated:start -->\nNEW\n<!-- generated:end -->'

describe('mergeGenerated', () => {
  it('replaces the generated block and keeps the handwritten tail', () => {
    const existing = '---\ntitle: x\n---\n\n<!-- generated:start -->\nOLD\n<!-- generated:end -->\n\n## Why it matters\n\nhand text\n'
    const out = mergeGenerated(existing, '---\ntitle: x\n---', generated)
    expect(out).toContain('NEW')
    expect(out).not.toContain('OLD')
    expect(out).toContain('## Why it matters\n\nhand text')
  })

  it('creates a page with generated block and empty handwritten sections when nothing exists', () => {
    const out = mergeGenerated(undefined, '---\ntitle: x\n---', generated)
    expect(out.startsWith('---\ntitle: x\n---\n\n<!-- generated:start -->')).toBe(true)
    expect(out).not.toContain('## Why it matters')
    expect(out).not.toContain('## How to fix')
  })

  it('throws when an existing page has no markers', () => {
    expect(() => mergeGenerated('no markers here', '---\ntitle: x\n---', generated)).toThrow('page has no generated markers')
  })

  it('replaces frontmatter with the generated one', () => {
    const existing = '---\ntitle: old\n---\n\n<!-- generated:start -->\nOLD\n<!-- generated:end -->\n'
    const out = mergeGenerated(existing, '---\ntitle: new\n---', generated)
    expect(out).toContain('title: new')
    expect(out).not.toContain('title: old')
  })
})

describe('buildRulesIndex', () => {
  it('groups checks by folder with locale titles and existing first page', () => {
    const index = buildRulesIndex()
    expect(index.total).toBeGreaterThan(0)
    expect(index.groups.map(g => g.folder)).toEqual([...index.groups.map(g => g.folder)].sort())
    const meta = index.groups.find(g => g.folder === 'meta')
    expect(meta.count).toBe(11)
    expect(meta.first).toBe('/rules/meta/canonical-no-chain')
    expect(meta.samples).toEqual(['canonical:no-chain', 'canonical:required'])
    expect(meta.title).toEqual({ en: 'Meta', ru: 'Мета' })
    for (const group of index.groups) {
      expect(existsSync(new URL(`../docs/content/en/6.rules${group.first.replace('/rules', '')}.md`, import.meta.url))).toBe(true)
    }
  })
})

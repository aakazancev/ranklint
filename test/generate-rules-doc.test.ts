import { describe, expect, it } from 'vitest'
import { mergeGenerated } from '../scripts/generate-rules-doc.mjs'

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
    expect(out).toContain('## Why it matters')
    expect(out).toContain('## How to fix')
  })

  it('uses localized section titles for new ru pages', () => {
    const out = mergeGenerated(undefined, '---\ntitle: x\n---', generated, 'ru')
    expect(out).toContain('## Почему это важно')
    expect(out).toContain('## Как исправить')
  })

  it('replaces frontmatter with the generated one', () => {
    const existing = '---\ntitle: old\n---\n\n<!-- generated:start -->\nOLD\n<!-- generated:end -->\n'
    const out = mergeGenerated(existing, '---\ntitle: new\n---', generated)
    expect(out).toContain('title: new')
    expect(out).not.toContain('title: old')
  })
})

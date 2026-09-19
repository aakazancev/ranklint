import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const pairs = [
  ['presets/github-actions/seo.yml', '.github/workflows/seo.yml'],
  ['presets/github-actions/monitor.yml', '.github/workflows/monitor.yml'],
]

describe('github workflow presets', () => {
  it.each(pairs)('%s is mirrored at %s', (preset, workflow) => {
    expect(readFileSync(workflow, 'utf8')).toBe(readFileSync(preset, 'utf8'))
  })
})

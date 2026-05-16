import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'

describe('bundle guard', () => {
  it('passes on current build', () => {
    const out = execFileSync('node', ['scripts/bundle-guard.mjs'], { encoding: 'utf8' })
    expect(out).toMatch(/client runtime: \d+ bytes gzip/)
  })
})

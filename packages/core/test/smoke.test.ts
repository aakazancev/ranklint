import { describe, expect, it } from 'vitest'
import { packageName } from '../src/index'

describe('@ranklint/core', () => {
  it('exports package name', () => {
    expect(packageName).toBe('@ranklint/core')
  })
})

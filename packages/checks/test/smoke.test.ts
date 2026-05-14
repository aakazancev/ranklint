import { describe, expect, it } from 'vitest'
import { packageName } from '../src/index'

describe('@ranklint/checks', () => {
  it('exports package name', () => {
    expect(packageName).toBe('@ranklint/checks')
  })
})

import { describe, expect, it } from 'vitest'
import { packageName } from '../src/index'

describe('@ranklint/devtools', () => {
  it('exports package name', () => {
    expect(packageName).toBe('@ranklint/devtools')
  })
})

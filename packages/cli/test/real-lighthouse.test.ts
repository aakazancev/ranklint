import { describe, expect, it } from 'vitest'
import { rejectOnUnhandled } from '../src/real-lighthouse'

describe('rejectOnUnhandled', () => {
  it('turns an unhandled rejection during the task into its rejection', async () => {
    const before = process.listenerCount('unhandledRejection')
    const task = new Promise<string>(() => {})
    const guarded = rejectOnUnhandled(task)
    process.emit('unhandledRejection', new Error('Target closed'), Promise.resolve())
    await expect(guarded).rejects.toThrow('Target closed')
    expect(process.listenerCount('unhandledRejection')).toBe(before)
  })

  it('resolves with the task result and removes its listener', async () => {
    const before = process.listenerCount('unhandledRejection')
    await expect(rejectOnUnhandled(Promise.resolve(42))).resolves.toBe(42)
    expect(process.listenerCount('unhandledRejection')).toBe(before)
  })
})

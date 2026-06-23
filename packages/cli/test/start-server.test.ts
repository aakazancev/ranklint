import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { startServer } from '../src/start-server'

const entry = fileURLToPath(new URL('./fixtures/fake-server.mjs', import.meta.url))

describe('startServer', () => {
  it('starts the entry on a free port, waits for readiness and stops it', async () => {
    const server = await startServer(entry)
    const res = await fetch(server.url)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
    await server.stop()
    await expect(fetch(server.url)).rejects.toThrow()
  }, 40_000)

  it('fails fast when the entry crashes', async () => {
    await expect(startServer('/nonexistent/entry.mjs', 5000)).rejects.toThrow(/exited|ready/)
  }, 20_000)
})

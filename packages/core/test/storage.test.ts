import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Report } from '../src/types'
import { describe, expect, it } from 'vitest'
import { FsReportStorage } from '../src/storage'

function report(timestamp: string): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp, pagesAudited: 0 },
    issues: [],
    crawlStats: { visited: 0, skipped: 0, external: 0, ignored: 0 },
  }
}

describe('FsReportStorage', () => {
  it('saves and loads by key with sanitization', async () => {
    const storage = new FsReportStorage(await mkdtemp(join(tmpdir(), 'ranklint-')))
    await storage.save(report('t1'), 'feature/my-branch')
    expect((await storage.load('feature/my-branch'))?.meta.timestamp).toBe('t1')
    expect(await storage.load('unknown')).toBeNull()
  })

  it('latest returns most recently written report', async () => {
    const storage = new FsReportStorage(await mkdtemp(join(tmpdir(), 'ranklint-')))
    await storage.save(report('old'), 'a')
    await new Promise(r => setTimeout(r, 20))
    await storage.save(report('new'), 'b')
    expect((await storage.latest())?.meta.timestamp).toBe('new')
  })

  it('latest returns null for missing dir', async () => {
    const storage = new FsReportStorage('/nonexistent/ranklint-reports')
    expect(await storage.latest()).toBeNull()
  })
})

describe('FsReportStorage retention and list', () => {
  it('prunes oldest reports beyond keep on save and lists chronologically', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-storage-keep-'))
    const storage = new FsReportStorage(dir, 2)
    await storage.save(report('t1'), 'first')
    await new Promise(r => setTimeout(r, 20))
    await storage.save(report('t2'), 'second')
    await new Promise(r => setTimeout(r, 20))
    await storage.save(report('t3'), 'third')
    const keys = (await storage.list()).map(e => e.key)
    expect(keys).toEqual(['second', 'third'])
    expect(await storage.load('first')).toBeNull()
    expect((await storage.latest())?.meta.timestamp).toBe('t3')
  })
})

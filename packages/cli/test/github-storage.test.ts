import { createServer, type Server } from 'node:http'
import { deflateRawSync } from 'node:zlib'
import type { Report } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GithubArtifactsStorage, unzipFile } from '../src/github-storage'

function zipEntry(name: string, data: Buffer, method: 0 | 8): Buffer {
  const nameBuf = Buffer.from(name)
  const payload = method === 8 ? deflateRawSync(data) : data
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034B50, 0)
  local.writeUInt16LE(20, 4)
  local.writeUInt16LE(method, 8)
  local.writeUInt32LE(payload.length, 18)
  local.writeUInt32LE(data.length, 22)
  local.writeUInt16LE(nameBuf.length, 26)
  const localBlock = Buffer.concat([local, nameBuf, payload])
  const central = Buffer.alloc(46)
  central.writeUInt32LE(0x02014B50, 0)
  central.writeUInt16LE(method, 10)
  central.writeUInt32LE(payload.length, 20)
  central.writeUInt32LE(data.length, 24)
  central.writeUInt16LE(nameBuf.length, 28)
  central.writeUInt32LE(0, 42)
  const centralBlock = Buffer.concat([central, nameBuf])
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054B50, 0)
  eocd.writeUInt16LE(1, 8)
  eocd.writeUInt16LE(1, 10)
  eocd.writeUInt32LE(centralBlock.length, 12)
  eocd.writeUInt32LE(localBlock.length, 16)
  return Buffer.concat([localBlock, centralBlock, eocd])
}

const report: Report = {
  formatVersion: 1,
  meta: { url: 'https://x.com', timestamp: '2026-01-01T00:00:00.000Z', pagesAudited: 1 },
  issues: [],
  crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
}

let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url?.startsWith('/repos/acme/shop/actions/artifacts')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        artifacts: [
          { id: 1, name: 'ranklint-report', expired: true, archive_download_url: `${base}/zip/1`, workflow_run: { head_branch: 'main' } },
          { id: 2, name: 'ranklint-report', expired: false, archive_download_url: `${base}/zip/2`, workflow_run: { head_branch: 'main' } },
          { id: 3, name: 'ranklint-report', expired: false, archive_download_url: `${base}/zip/3`, workflow_run: { head_branch: 'dev' } },
        ],
      }))
      return
    }
    if (req.url?.startsWith('/zip/')) {
      res.writeHead(200, { 'content-type': 'application/zip' })
      res.end(zipEntry('ranklint-report.json', Buffer.from(JSON.stringify(report)), 8))
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('unzipFile', () => {
  const content = Buffer.from('{"hello":"world"}')

  it('extracts stored and deflated entries', () => {
    expect(unzipFile(zipEntry('a.json', content, 0), 'a.json')?.toString()).toBe(content.toString())
    expect(unzipFile(zipEntry('a.json', content, 8), 'a.json')?.toString()).toBe(content.toString())
  })

  it('returns null for missing entries and garbage', () => {
    expect(unzipFile(zipEntry('a.json', content, 0), 'b.json')).toBeNull()
    expect(unzipFile(Buffer.from('not a zip at all........'), 'a.json')).toBeNull()
  })

  it('returns null instead of throwing on malformed offsets', () => {
    const evil = Buffer.alloc(22)
    evil.writeUInt32LE(0x06054B50, 0)
    evil.writeUInt16LE(1, 10)
    evil.writeUInt32LE(0xFFFFFF00, 16)
    expect(unzipFile(evil, 'a.json')).toBeNull()
    const truncated = zipEntry('a.json', content, 8).subarray(0, 40)
    const eocd = Buffer.alloc(22)
    eocd.writeUInt32LE(0x06054B50, 0)
    eocd.writeUInt16LE(1, 10)
    eocd.writeUInt32LE(0, 16)
    expect(unzipFile(Buffer.concat([truncated, eocd]), 'a.json')).toBeNull()
  })
})

describe('GithubArtifactsStorage', () => {
  const storage = () => new GithubArtifactsStorage({ apiUrl: base, repository: 'acme/shop', token: 'tok' })

  it('loads the newest unexpired artifact for a branch and unpacks the report', async () => {
    const loaded = await storage().load('main')
    expect(loaded?.meta.url).toBe('https://x.com')
  })

  it('returns null when no artifact matches the ref', async () => {
    expect(await storage().load('feature/nope')).toBeNull()
  })

  it('latest() ignores the branch filter', async () => {
    const loaded = await storage().latest()
    expect(loaded?.formatVersion).toBe(1)
  })

  it('save() is read-only', async () => {
    await expect(storage().save()).rejects.toThrow('read-only')
  })
})

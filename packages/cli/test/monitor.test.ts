import { generateKeyPairSync } from 'node:crypto'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PageFetcher } from '@ranklint/core'
import { FsReportStorage } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fetchCruxField } from '../src/crux'
import { notify } from '../src/notify'
import { runMonitor } from '../src/run-monitor'
import { S3ReportStorage, type S3Client } from '../src/s3-storage'

function fetcherFor(html: string): PageFetcher {
  return {
    fetch: async url => ({ url, html, statusCode: 200, headers: {}, ttfb: 1, links: [] }),
    head: async () => ({ statusCode: 200, headers: {} }),
    close: async () => {},
  }
}

const cleanPage = '<html lang="en"><head><title>Monitored page title long enough here</title>'
  + '<meta name="description" content="A monitored page description easily long enough to satisfy the seventy character default minimum.">'
  + '<link rel="canonical" href="https://site.test/"></head>'
  + '<body><h1>Monitored page heading long enough</h1></body></html>'
const brokenPage = cleanPage.replace('<h1>Monitored page heading long enough</h1>', '')

describe('runMonitor', () => {
  it('first run stores report without alert, second alerts on new issues, always exit-neutral', async () => {
    const storage = new FsReportStorage(await mkdtemp(join(tmpdir(), 'ranklint-monitor-')))
    const config = { site: { url: 'https://site.test' } }
    const sent: string[] = []
    const notifyEnv = {}

    const first = await runMonitor({
      url: 'https://site.test/',
      fetcher: fetcherFor(cleanPage),
      config,
      storage,
      notifyEnv,
    })
    expect(first.diff).toBeNull()
    expect(first.notified).toEqual([])

    const second = await runMonitor({
      url: 'https://site.test/',
      fetcher: fetcherFor(brokenPage),
      config,
      storage,
      notifyEnv,
    })
    expect(second.diff?.newIssues.map(i => i.checkId)).toContain('headings:single-h1')
    expect(sent).toEqual([])

    const third = await runMonitor({
      url: 'https://site.test/',
      fetcher: fetcherFor(brokenPage),
      config,
      storage,
      notifyEnv,
    })
    expect(third.diff?.newIssues).toEqual([])
  })
})

describe('S3ReportStorage', () => {
  function fakeClient(): { client: S3Client, objects: Map<string, string> } {
    const objects = new Map<string, string>()
    let counter = 0
    const modified = new Map<string, number>()
    return {
      objects,
      client: {
        async putObject(key, body) {
          objects.set(key, body)
          modified.set(key, ++counter)
        },
        async getObject(key) {
          return objects.get(key) ?? null
        },
        async listKeys(prefix) {
          return [...objects.keys()]
            .filter(k => k.startsWith(prefix))
            .map(key => ({ key, lastModified: modified.get(key) ?? 0 }))
        },
      },
    }
  }

  const report = (timestamp: string) => ({
    formatVersion: 1 as const,
    meta: { url: 'https://x.com', timestamp, pagesAudited: 0 },
    issues: [],
    crawlStats: { visited: 0, skipped: 0, external: 0, ignored: 0 },
  })

  it('saves, loads and returns latest', async () => {
    const { client } = fakeClient()
    const storage = new S3ReportStorage({ bucket: 'b', client })
    await storage.save(report('t1'), '2026-07-01')
    await storage.save(report('t2'), '2026-07-02')
    expect((await storage.load('2026-07-01'))?.meta.timestamp).toBe('t1')
    expect((await storage.latest())?.meta.timestamp).toBe('t2')
    expect(await storage.load('missing')).toBeNull()
  })
})

describe('notify + crux against mock server', () => {
  let server: Server
  let base: string
  const received: { url: string, body: string }[] = []

  beforeAll(async () => {
    server = createServer((req, res) => {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        received.push({ url: req.url ?? '', body })
        if (req.url?.includes('crux-404')) {
          res.writeHead(404)
          res.end()
          return
        }
        if (req.url?.includes('crux')) {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({
            record: {
              metrics: {
                largest_contentful_paint: { percentiles: { p75: 2100 } },
                cumulative_layout_shift: { percentiles: { p75: '0.05' } },
                interaction_to_next_paint: { percentiles: { p75: 180 } },
              },
            },
          }))
          return
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end('{"ok":true}')
      })
    })
    await new Promise<void>(r => server.listen(0, () => r()))
    const address = server.address()
    base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
  })

  afterAll(() => new Promise<void>(r => server.close(() => r())))

  it('sends slack and telegram notifications', async () => {
    const diff = {
      newIssues: [{ checkId: 'headings:single-h1', severity: 'error' as const, message: 'm', url: 'https://x.com/' }],
      fixedIssues: [],
      pagesDelta: { added: [], removed: [] },
    }
    const sent = await notify(diff, 'https://x.com', {
      slackWebhook: `${base}/slack`,
      telegramBotToken: 'token',
      telegramChatId: '42',
      telegramApiBase: base,
    })
    expect(sent).toEqual(['slack', 'telegram'])
    expect(received.find(r => r.url === '/slack')?.body).toContain('new SEO issues')
    expect(received.find(r => r.url.includes('sendMessage'))?.body).toContain('"chat_id":"42"')
  })

  it('fetches crux p75 field data and handles 404', async () => {
    const data = await fetchCruxField('https://x.com', 'key', `${base}/crux`)
    expect(data).toEqual({ lcp: 2100, cls: 0.05, inp: 180 })
    expect(await fetchCruxField('https://unknown.com', 'key', `${base}/crux-404`)).toBeNull()
  })
})

describe('runMonitor with a gsc service account key file', () => {
  it('exchanges the key for a token and inspects urls', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const auths: string[] = []
    const server = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/json' })
      if (req.url === '/token') {
        res.end(JSON.stringify({ access_token: 'sa-token' }))
        return
      }
      auths.push(req.headers.authorization ?? '')
      res.end(JSON.stringify({ inspectionResult: { indexStatusResult: { verdict: 'PASS' } } }))
    })
    await new Promise<void>(r => server.listen(0, () => r()))
    const address = server.address()
    const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`

    const dir = await mkdtemp(join(tmpdir(), 'ranklint-gsc-key-'))
    const keyFile = join(dir, 'sa.json')
    await writeFile(keyFile, JSON.stringify({
      client_email: 'bot@project.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    }))

    const result = await runMonitor({
      url: 'https://site.test/',
      fetcher: fetcherFor(cleanPage),
      config: { site: { url: 'https://site.test' } },
      storage: new FsReportStorage(await mkdtemp(join(tmpdir(), 'ranklint-monitor-'))),
      notifyEnv: {},
      gscKeyFile: keyFile,
      gscTokenUrl: `${base}/token`,
      gscApiUrl: `${base}/inspect`,
      gscProperty: 'https://site.test',
    })
    await new Promise<void>(r => server.close(() => r()))

    expect(auths[0]).toBe('Bearer sa-token')
    expect(result.report.searchConsole?.inspected[0]).toMatchObject({ verdict: 'PASS' })
  })
})

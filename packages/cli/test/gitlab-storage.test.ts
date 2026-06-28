import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { GitlabArtifactsStorage } from '../src/gitlab-storage'

const baseReport = {
  formatVersion: 1,
  meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 1 },
  issues: [],
  crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
}

let server: Server
let apiUrl: string
let lastPath = ''

beforeAll(async () => {
  server = createServer((req, res) => {
    lastPath = req.url ?? ''
    if (req.url?.includes('/artifacts/main/')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(baseReport))
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  apiUrl = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/api/v4`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('GitlabArtifactsStorage', () => {
  const storage = () => new GitlabArtifactsStorage({ apiUrl, projectId: '42', job: 'seo:audit' })

  it('loads a report by ref via artifacts api', async () => {
    const report = await storage().load('main')
    expect(report?.formatVersion).toBe(1)
    expect(lastPath).toBe('/api/v4/projects/42/jobs/artifacts/main/raw/ranklint-report.json?job=seo%3Aaudit')
  })

  it('returns null when the base artifact is missing', async () => {
    expect(await storage().load('feature/unknown')).toBeNull()
  })

  it('refuses to save', async () => {
    await expect(storage().save()).rejects.toThrow('read-only')
  })

  it('requires api url and project id', () => {
    delete process.env.CI_API_V4_URL
    delete process.env.CI_PROJECT_ID
    expect(() => new GitlabArtifactsStorage()).toThrow('CI_API_V4_URL')
  })
})

import { createServer, type Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inspectUrls } from '../src/gsc'

let server: Server
let base: string
const requests: { auth: string, body: string }[] = []

beforeAll(async () => {
  server = createServer((req, res) => {
    let body = ''
    req.on('data', chunk => body += chunk)
    req.on('end', () => {
      requests.push({ auth: req.headers.authorization ?? '', body })
      const parsed = JSON.parse(body) as { inspectionUrl: string }
      if (parsed.inspectionUrl.includes('broken')) {
        res.writeHead(403)
        res.end()
        return
      }
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({
        inspectionResult: {
          indexStatusResult: {
            verdict: 'PASS',
            coverageState: 'Submitted and indexed',
            indexingState: 'INDEXING_ALLOWED',
          },
          richResultsResult: {
            detectedItems: [{ items: [{ issues: [{ issueMessage: 'Missing field "priceCurrency"' }] }] }],
          },
        },
      }))
    })
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('inspectUrls', () => {
  it('inspects each url with bearer token and extracts coverage + rich results', async () => {
    const data = await inspectUrls('https://x.com', ['https://x.com/', 'https://x.com/broken'], 'tok', base)
    expect(requests[0]?.auth).toBe('Bearer tok')
    expect(JSON.parse(requests[0]!.body)).toMatchObject({ siteUrl: 'https://x.com' })
    expect(data.inspected[0]).toMatchObject({
      verdict: 'PASS',
      coverageState: 'Submitted and indexed',
      richResultsIssues: ['Missing field "priceCurrency"'],
    })
    expect(data.inspected[1]?.verdict).toBe('API error 403')
  })
})

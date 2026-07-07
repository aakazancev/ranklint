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

describe('serviceAccountToken', () => {
  it('signs an RS256 jwt and exchanges it for an access token', async () => {
    const { generateKeyPairSync, createVerify } = await import('node:crypto')
    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    let received: { grant: string | null, header: unknown, claims: unknown, valid: boolean } | undefined
    const tokenServer = createServer((req, res) => {
      let body = ''
      req.on('data', chunk => body += chunk)
      req.on('end', () => {
        const params = new URLSearchParams(body)
        const assertion = params.get('assertion') ?? ''
        const [h, c, sig] = assertion.split('.')
        received = {
          grant: params.get('grant_type'),
          header: JSON.parse(Buffer.from(h!, 'base64url').toString()),
          claims: JSON.parse(Buffer.from(c!, 'base64url').toString()),
          valid: createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, sig!, 'base64url'),
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ access_token: 'exchanged-token' }))
      })
    })
    await new Promise<void>(r => tokenServer.listen(0, () => r()))
    const address = tokenServer.address()
    const url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}/token`

    const { serviceAccountToken } = await import('../src/gsc')
    const token = await serviceAccountToken({
      client_email: 'bot@project.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    }, url)
    await new Promise<void>(r => tokenServer.close(() => r()))

    expect(token).toBe('exchanged-token')
    expect(received?.grant).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer')
    expect(received?.header).toEqual({ alg: 'RS256', typ: 'JWT' })
    expect(received?.claims).toMatchObject({
      iss: 'bot@project.iam.gserviceaccount.com',
      aud: url,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    })
    expect(received?.valid).toBe(true)
  })

  it('throws on http error and missing access_token', async () => {
    const bad = createServer((_req, res) => { res.writeHead(403); res.end() })
    await new Promise<void>(r => bad.listen(0, () => r()))
    const address = bad.address()
    const url = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
    const { serviceAccountToken } = await import('../src/gsc')
    const { generateKeyPairSync } = await import('node:crypto')
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
    const key = {
      client_email: 'bot@project.iam.gserviceaccount.com',
      private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    }
    await expect(serviceAccountToken(key, url)).rejects.toThrow('403')
    await new Promise<void>(r => bad.close(() => r()))
  })
})

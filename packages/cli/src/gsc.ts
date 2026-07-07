import { createSign } from 'node:crypto'
import type { SearchConsoleData, SearchConsolePage } from '@ranklint/core'

const GSC_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface ServiceAccountKey {
  client_email: string
  private_key: string
  token_uri?: string
}

export async function serviceAccountToken(key: ServiceAccountKey, tokenUrl?: string): Promise<string> {
  const url = tokenUrl ?? key.token_uri ?? GOOGLE_TOKEN_URL
  const now = Math.floor(Date.now() / 1000)
  const encode = (part: object) => Buffer.from(JSON.stringify(part)).toString('base64url')
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: key.client_email,
    scope: GSC_SCOPE,
    aud: url,
    iat: now,
    exp: now + 3600,
  })}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url')
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  })
  if (!res.ok) throw new Error(`GSC token exchange failed with ${res.status}`)
  const data = await res.json() as { access_token?: string }
  if (!data.access_token) throw new Error('GSC token exchange returned no access_token')
  return data.access_token
}

interface InspectResponse {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string
      coverageState?: string
      indexingState?: string
    }
    richResultsResult?: {
      detectedItems?: {
        items?: { issues?: { issueMessage?: string }[] }[]
      }[]
    }
  }
}

export async function inspectUrls(
  property: string,
  urls: string[],
  token: string,
  apiUrl = GSC_API,
): Promise<SearchConsoleData> {
  const inspected: SearchConsolePage[] = []
  for (const url of urls) {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ inspectionUrl: url, siteUrl: property }),
    })
    if (!res.ok) {
      inspected.push({ url, verdict: `API error ${res.status}`, richResultsIssues: [] })
      continue
    }
    const data = await res.json() as InspectResponse
    const index = data.inspectionResult?.indexStatusResult
    const richIssues = (data.inspectionResult?.richResultsResult?.detectedItems ?? [])
      .flatMap(item => item.items ?? [])
      .flatMap(item => item.issues ?? [])
      .map(issue => issue.issueMessage ?? '')
      .filter(Boolean)
    inspected.push({
      url,
      verdict: index?.verdict,
      coverageState: index?.coverageState,
      indexingState: index?.indexingState,
      richResultsIssues: richIssues,
    })
  }
  return { property, inspected }
}

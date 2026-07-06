import type { SearchConsoleData, SearchConsolePage } from '@ranklint/core'

const GSC_API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

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

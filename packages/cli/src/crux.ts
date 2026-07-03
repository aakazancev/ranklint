import type { CruxFieldData } from '@ranklint/core'

const CRUX_API = 'https://chromeuxreport.googleapis.com/v1/records:queryRecord'

interface CruxResponse {
  record?: {
    metrics?: Record<string, { percentiles?: { p75?: number | string } }>
  }
}

export async function fetchCruxField(
  origin: string,
  apiKey: string,
  apiUrl = CRUX_API,
): Promise<CruxFieldData | null> {
  const res = await fetch(`${apiUrl}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ origin, formFactor: 'PHONE' }),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`CrUX API responded ${res.status}`)
  const data = await res.json() as CruxResponse
  const p75 = (metric: string) => {
    const value = data.record?.metrics?.[metric]?.percentiles?.p75
    return value === undefined ? undefined : Number(value)
  }
  return {
    lcp: p75('largest_contentful_paint'),
    cls: p75('cumulative_layout_shift'),
    inp: p75('interaction_to_next_paint'),
  }
}

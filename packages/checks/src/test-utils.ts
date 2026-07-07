import type { Check, Issue, PageFetcher, PageLink, PageSnapshot } from '@ranklint/core'
import { parseHTML } from 'linkedom'

export const stubFetcher: PageFetcher = {
  fetch: async url => ({ url, html: '', statusCode: 200, headers: {}, ttfb: 1, links: [] }),
  head: async () => ({ statusCode: 200, headers: {} }),
  close: async () => {},
}

export function fakeHeadFetcher(
  responses: Record<string, { status: number, location?: string }>,
): PageFetcher {
  return {
    ...stubFetcher,
    head: async (url) => {
      const res = responses[url] ?? responses[new URL(url).pathname]
      if (!res) return { statusCode: 404, headers: {} }
      const headers: Record<string, string> = res.location ? { location: res.location } : {}
      return { statusCode: res.status, headers }
    },
  }
}

export interface RunCheckOptions {
  url?: string
  siteUrl?: string
  options?: Record<string, unknown>
  links?: PageLink[]
  fetcher?: PageFetcher
  aboveFoldImages?: string[]
}

export async function runCheckOnHtml(
  check: Check,
  html: string,
  opts: RunCheckOptions = {},
): Promise<Issue[]> {
  const url = opts.url ?? 'https://example.com/'
  const snapshot: PageSnapshot = {
    url,
    html,
    statusCode: 200,
    headers: {},
    ttfb: 1,
    links: opts.links ?? [],
    aboveFoldImages: opts.aboveFoldImages,
  }
  const { document } = parseHTML(html)
  return check.run({
    page: snapshot,
    document: document as unknown as Document,
    config: { severity: check.severity, options: opts.options ?? {} },
    site: { url: opts.siteUrl ?? new URL(url).origin },
    fetcher: opts.fetcher ?? stubFetcher,
  })
}

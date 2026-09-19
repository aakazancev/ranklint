import type { Issue, PageFetcher, PageSnapshot } from '@ranklint/core'
import { level1Checks } from '@ranklint/checks/level1'

export const LEVEL1_COUNT = level1Checks.length

const stubFetcher: PageFetcher = {
  fetch: async url => ({ url, html: '', statusCode: 200, headers: {}, ttfb: 0, links: [] }),
  head: async () => ({ statusCode: 200, headers: {} }),
  close: async () => {},
}

export async function lintHtml(html: string, url = 'https://example.com/'): Promise<Issue[]> {
  const document = new DOMParser().parseFromString(html, 'text/html')
  const page: PageSnapshot = { url, html, statusCode: 200, headers: {}, ttfb: 0, links: [] }
  const issues: Issue[] = []
  for (const check of level1Checks) {
    try {
      issues.push(...await check.run({
        page,
        document,
        config: { severity: check.severity, options: {} },
        site: { url: new URL(url).origin },
        fetcher: stubFetcher,
      }))
    } catch {
      continue
    }
  }
  return issues
}

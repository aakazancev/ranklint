import type { PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { ssrContent } from '../src/checks/indexability/ssr-content'
import { stubFetcher } from '../src/test-utils'

function run(html: string, ssrHtml: string | undefined, options: Record<string, unknown> = {}) {
  const page: PageSnapshot = {
    url: 'https://x.com/',
    html,
    ssrHtml,
    statusCode: 200,
    headers: {},
    ttfb: 1,
    links: [],
  }
  return ssrContent.run({
    page,
    config: { severity: 'error', options },
    site: { url: 'https://x.com' },
    fetcher: stubFetcher,
  })
}

const hydrated = '<html><body><h1>Client rendered heading</h1><p>Long article text that appears after hydration with plenty of words in it.</p></body></html>'

describe('indexability:ssr-content', () => {
  it('silent without ssrHtml', async () => {
    expect(await run(hydrated, undefined)).toEqual([])
  })

  it('passes when ssr matches hydrated content', async () => {
    expect(await run(hydrated, hydrated)).toEqual([])
  })

  it('flags client-only h1 and low ssr text ratio', async () => {
    const emptySsr = '<html><body><div id="app"></div></body></html>'
    const issues = await run(hydrated, emptySsr)
    expect(issues).toHaveLength(2)
    expect(issues[0]?.message).toContain('H1 is rendered client-side')
    expect(issues[1]?.message).toContain('server-rendered')
  })

  it('respects minRatio option', async () => {
    const halfSsr = '<html><body><h1>Client rendered heading</h1><p>Long article text that appears</p></body></html>'
    expect(await run(hydrated, halfSsr, { minRatio: 0.3 })).toEqual([])
  })
})

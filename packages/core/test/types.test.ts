import { describe, expect, it } from 'vitest'
import type { Check, Issue, PageSnapshot, Report } from '../src/types'

describe('core types', () => {
  it('fixes the report contract', () => {
    const issue: Issue = {
      checkId: 'meta:title-length',
      severity: 'error',
      message: 'Title too short',
      url: 'https://example.com/',
      suggestion: 'Use 30-60 characters',
    }
    const report: Report = {
      formatVersion: 1,
      meta: { url: 'https://example.com', timestamp: '2026-01-01T00:00:00Z', pagesAudited: 1 },
      issues: [issue],
      crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
    }
    expect(report.formatVersion).toBe(1)
    expect(report.issues[0]?.checkId).toBe('meta:title-length')
  })

  it('fixes the check contract', async () => {
    const snapshot: PageSnapshot = {
      url: 'https://example.com/',
      html: '<html></html>',
      statusCode: 200,
      headers: {},
      ttfb: 10,
      links: [],
    }
    const check: Check = {
      id: 'meta:title-required',
      category: 'meta',
      severity: 'error',
      scope: 'page',
      run: async () => [],
    }
    const result = await check.run({
      page: snapshot,
      config: { severity: 'error', options: {} },
      site: { url: 'https://example.com' },
      fetcher: {
        fetch: async () => snapshot,
        head: async () => ({ statusCode: 200, headers: {} }),
        close: async () => {},
      },
    })
    expect(result).toEqual([])
  })
})

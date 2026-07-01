import type { Report } from '../src/types'
import { describe, expect, it } from 'vitest'
import { diffReports } from '../src/diff'

function report(lighthouse: Report['lighthouse']): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 1 },
    issues: [],
    pages: ['/'],
    lighthouse,
    crawlStats: { visited: 1, skipped: 0, external: 0, ignored: 0 },
  }
}

describe('lighthouse deltas in diff', () => {
  it('reports changed metrics matched by pathname across origins', () => {
    const base = report([{ url: 'https://x.com/listing/1', runs: 5, aggregation: 'median', metrics: { performance: 90, lcp: 2100 } }])
    const current = report([{ url: 'https://preview.x.com/listing/1', runs: 5, aggregation: 'median', metrics: { performance: 90, lcp: 2700 } }])
    const diff = diffReports(base, current)
    expect(diff.lighthouse).toEqual([
      { url: 'https://preview.x.com/listing/1', metric: 'lcp', base: 2100, current: 2700 },
    ])
  })

  it('is undefined when either side has no lighthouse data', () => {
    expect(diffReports(report(undefined), report([])).lighthouse).toBeUndefined()
  })
})

import type { Issue, Report } from '../src/types'
import { describe, expect, it } from 'vitest'
import { diffReports, issueKey } from '../src/diff'

function issue(overrides: Partial<Issue>): Issue {
  return {
    checkId: 'meta:title-required',
    severity: 'error',
    message: 'm',
    url: 'https://x.com/page',
    ...overrides,
  }
}

function report(issues: Issue[], pages: string[] = [], formatVersion = 1): Report {
  return {
    formatVersion: formatVersion as 1,
    meta: { url: 'https://x.com', timestamp: 't', pagesAudited: pages.length },
    issues,
    pages,
    crawlStats: { visited: 0, skipped: 0, external: 0, ignored: 0 },
  }
}

describe('issueKey', () => {
  it('drops origin so preview and prod urls match', () => {
    expect(issueKey(issue({ url: 'https://preview.x.com/page?f=1' })))
      .toBe(issueKey(issue({ url: 'https://x.com/page?f=1' })))
  })

  it('distinguishes selector and check', () => {
    expect(issueKey(issue({ selector: 'a[href="/a"]' })))
      .not.toBe(issueKey(issue({ selector: 'a[href="/b"]' })))
    expect(issueKey(issue({ checkId: 'headings:single-h1' })))
      .not.toBe(issueKey(issue({})))
  })
})

describe('diffReports', () => {
  it('finds new and fixed issues across origins', () => {
    const base = report([issue({ url: 'https://x.com/old-bug' })], ['/old-bug'])
    const current = report([issue({ url: 'https://preview.x.com/new-bug' })], ['/new-bug', '/added'])
    const diff = diffReports(base, current)
    expect(diff.newIssues).toHaveLength(1)
    expect(diff.newIssues[0]?.url).toContain('/new-bug')
    expect(diff.fixedIssues).toHaveLength(1)
    expect(diff.fixedIssues[0]?.url).toContain('/old-bug')
    expect(diff.pagesDelta).toEqual({ added: ['/added', '/new-bug'], removed: ['/old-bug'] })
  })

  it('treats identical reports as no changes', () => {
    const a = report([issue({})], ['/page'])
    const b = report([issue({ url: 'https://other.com/page' })], ['/page'])
    const diff = diffReports(a, b)
    expect(diff.newIssues).toEqual([])
    expect(diff.fixedIssues).toEqual([])
  })

  it('refuses to diff different format versions', () => {
    expect(() => diffReports(report([], [], 1), report([], [], 2)))
      .toThrow('different formats')
  })
})

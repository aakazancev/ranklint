import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { json, junit, markdown } from '../src/index'

function report(overrides: Partial<Report> = {}): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: '2026-07-01T00:00:00Z', pagesAudited: 2 },
    issues: [
      {
        checkId: 'meta:title-length',
        severity: 'warn',
        message: 'Title is 4 chars',
        url: 'https://x.com/a',
        suggestion: 'Make it longer',
      },
      {
        checkId: 'headings:single-h1',
        severity: 'error',
        message: 'Page has 2 <h1> & more',
        url: 'https://x.com/b',
      },
    ],
    crawlStats: { visited: 2, skipped: 0, external: 0, ignored: 0 },
    ...overrides,
  }
}

describe('json reporter', () => {
  it('round-trips the report', () => {
    expect(JSON.parse(json(report()))).toEqual(report())
  })
})

describe('markdown reporter', () => {
  it('renders summary and issue table sorted by severity', () => {
    const out = markdown(report())
    expect(out).toContain('**1 errors, 1 warnings, 0 info**')
    expect(out).toContain('| Severity | Check | URL | Message | Suggestion |')
    expect(out.indexOf('headings:single-h1')).toBeLessThan(out.indexOf('meta:title-length'))
    expect(out).toContain('Make it longer')
  })

  it('renders empty state and truncation note', () => {
    const out = markdown(report({ issues: [], meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 1, truncated: true } }))
    expect(out).toContain('No issues found.')
    expect(out).toContain('truncated')
  })
})

describe('junit reporter', () => {
  it('renders a failure per issue with xml escaping', () => {
    const out = junit(report())
    expect(out).toContain('<testsuites name="ranklint" tests="2" failures="2">')
    expect(out).toContain('<testcase name="meta:title-length https://x.com/a"')
    expect(out).toContain('Page has 2 &lt;h1&gt; &amp; more')
    expect(out).not.toContain('<h1> & more')
  })

  it('renders a passing case for empty report', () => {
    const out = junit(report({ issues: [] }))
    expect(out).toContain('failures="0"')
    expect(out).toContain('<testcase name="no issues"')
  })
})

import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { gitlab } from '../src/gitlab'
import { html } from '../src/html'

const report: Report = {
  formatVersion: 1,
  meta: { url: 'https://x.com', timestamp: 't', pagesAudited: 2 },
  issues: [
    {
      checkId: 'headings:single-h1',
      severity: 'error',
      message: '2 <h1> tags & stuff',
      url: 'https://x.com/page',
      selector: 'h1',
      suggestion: 'Keep one h1',
    },
    { checkId: 'meta:title-length', severity: 'warn', message: 'short', url: 'https://x.com/other' },
  ],
  crawlStats: { visited: 2, skipped: 0, external: 0, ignored: 0 },
}

describe('gitlab reporter', () => {
  it('renders codequality entries with stable fingerprints', () => {
    const entries = JSON.parse(gitlab(report)) as Record<string, unknown>[]
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      check_name: 'headings:single-h1',
      severity: 'major',
      location: { path: 'page', lines: { begin: 1 } },
    })
    expect(entries[0]!.fingerprint).toBe((JSON.parse(gitlab(report)) as Record<string, unknown>[])[0]!.fingerprint)
    expect(entries[1]).toMatchObject({ severity: 'minor' })
  })
})

describe('html reporter', () => {
  it('renders a self-contained escaped page', () => {
    const out = html(report)
    expect(out).toContain('<!doctype html>')
    expect(out).toContain('2 &lt;h1&gt; tags &amp; stuff')
    expect(out).toContain('<b>1</b> errors')
    expect(out).toContain('💡 Keep one h1')
    expect(out).not.toContain('2 <h1> tags')
  })

  it('renders empty state', () => {
    expect(html({ ...report, issues: [] })).toContain('No issues found')
  })
})

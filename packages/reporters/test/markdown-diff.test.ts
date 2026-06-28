import type { DiffResult } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { markdownDiff } from '../src/markdown-diff'

const diff: DiffResult = {
  newIssues: [
    { checkId: 'headings:single-h1', severity: 'error', message: '2 h1', url: 'https://x.com/a' },
    { checkId: 'meta:title-length', severity: 'warn', message: 'short', url: 'https://x.com/b' },
  ],
  fixedIssues: [
    { checkId: 'links:no-broken', severity: 'error', message: '404', url: 'https://x.com/c' },
  ],
  pagesDelta: { added: ['/new-page'], removed: [] },
}

describe('markdownDiff', () => {
  it('renders summary, new, fixed and pages sections', () => {
    const out = markdownDiff(diff)
    expect(out).toContain('**2 new issues (1 errors) · 1 fixed**')
    expect(out).toContain('### 🔴 New issues')
    expect(out).toContain('headings:single-h1')
    expect(out).toContain('### ✅ Fixed')
    expect(out).toContain('links:no-broken')
    expect(out).toContain('Added: `/new-page`')
  })

  it('renders clean state', () => {
    const out = markdownDiff({ newIssues: [], fixedIssues: [], pagesDelta: { added: [], removed: [] } })
    expect(out).toContain('No SEO changes detected')
  })
})

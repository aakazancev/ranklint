import { describe, expect, it } from 'vitest'
import { level1Checks } from '@ranklint/checks/level1'
import { DEMO_SAMPLE } from '../../docs/app/utils/demo'
import { LEVEL1_COUNT, lintHtml } from '../../docs/app/utils/lint-html'

const goodDescription = 'Ranklint runs level one SEO rules right in the browser so you can see the real issues of a page without leaving the landing.'

const goodHtml = `<html lang="en"><head>
<title>Good enough title for the page</title>
<meta name="description" content="${goodDescription}">
<link rel="canonical" href="https://example.com/">
<meta property="og:title" content="Good enough title for the page">
<meta property="og:description" content="${goodDescription}">
<meta property="og:image" content="https://example.com/og.png">
<meta name="twitter:card" content="summary">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head><body><h1>Good enough title for the page</h1></body></html>`

describe('lintHtml', () => {
  it('reports missing title and description on a bare page', async () => {
    const issues = await lintHtml('<html><head></head><body><h1>Hi</h1></body></html>')
    const ids = issues.map(issue => issue.checkId)
    expect(ids).toContain('meta:title-required')
    expect(ids).toContain('meta:description-required')
  })

  it('reports no errors on a page with complete meta', async () => {
    const issues = await lintHtml(goodHtml)
    expect(issues.filter(issue => issue.severity === 'error')).toEqual([])
  })

  it('exposes the number of level 1 checks', () => {
    expect(LEVEL1_COUNT).toBe(level1Checks.length)
  })
})

describe('demo sample', () => {
  it('finds seven issues with three errors', async () => {
    const issues = await lintHtml(DEMO_SAMPLE)
    expect(issues).toHaveLength(7)
    expect(issues.filter(issue => issue.severity === 'error')).toHaveLength(3)
  })

  it('renders no em or en dashes on the landing', async () => {
    const issues = await lintHtml(DEMO_SAMPLE)
    const text = issues.map(issue => `${issue.checkId} ${issue.message} ${issue.suggestion}`).join(' ')
    expect(text).not.toMatch(/[–—]/)
  })

  it('links every issue at a rule page', async () => {
    const issues = await lintHtml(DEMO_SAMPLE)
    expect(issues.every(issue => issue.docs?.includes('/rules/'))).toBe(true)
  })
})

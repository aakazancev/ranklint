import { describe, expect, it } from 'vitest'
import { buildPageReport } from '../src/runtime/server/utils/page-report'

const html = `<!doctype html><html><head>
<title>A well sized page title for the devtools test</title>
<meta name="description" content="A description that is definitely long enough to satisfy the default seventy character minimum rule.">
<link rel="canonical" href="https://x.com/page">
<meta property="og:title" content="OG title">
<link rel="alternate" hreflang="en" href="https://x.com/en/page">
<script type="application/ld+json">{"@type":"Product","name":"Widget"}</script>
<script type="application/ld+json">{"@type":"Article"}</script>
</head><body>
<h1>Main heading long enough for checks</h1>
<h3>Jumped level heading</h3>
<h2></h2>
</body></html>`

describe('buildPageReport', () => {
  it('extracts outline with problem flags', async () => {
    const report = await buildPageReport(html, 'https://x.com/page')
    expect(report.outline).toEqual([
      { level: 1, text: 'Main heading long enough for checks', problems: [] },
      { level: 3, text: 'Jumped level heading', problems: ['jump from h1'] },
      { level: 2, text: '', problems: ['empty'] },
    ])
  })

  it('extracts meta including og and hreflang', async () => {
    const report = await buildPageReport(html, 'https://x.com/page')
    expect(report.meta.title).toContain('well sized')
    expect(report.meta['og:title']).toBe('OG title')
    expect(report.meta.canonical).toBe('https://x.com/page')
    expect(report.meta['hreflang:en']).toBe('https://x.com/en/page')
  })

  it('validates jsonld blocks', async () => {
    const report = await buildPageReport(html, 'https://x.com/page')
    expect(report.jsonLd).toHaveLength(2)
    expect(report.jsonLd[0]).toMatchObject({ type: 'Product', valid: true })
    expect(report.jsonLd[1]).toMatchObject({ type: 'Article', valid: false })
  })

  it('runs no-network page checks', async () => {
    const report = await buildPageReport(html, 'https://x.com/page')
    const ids = new Set(report.issues.map(i => i.checkId))
    expect(ids).toContain('headings:hierarchy')
    expect(ids).toContain('headings:no-empty')
    expect(ids).not.toContain('links:no-broken')
    expect(ids).not.toContain('canonical:valid')
  })
})

import { describe, expect, it } from 'vitest'
import { parseHTML } from 'linkedom'
import { buildPageReport, collectInternalLinks } from '../src/report'

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
<a href="/about">About</a>
<a href="/about#team">Team</a>
<a href="https://x.com/pricing?plan=pro">Pricing</a>
<a href="https://other.com/page">External</a>
<a href="mailto:hi@x.com">Mail</a>
<a href="#top">Top</a>
</body></html>`

function doc(): Document {
  return parseHTML(html).document as unknown as Document
}

describe('buildPageReport', () => {
  it('extracts outline with problem flags', async () => {
    const report = await buildPageReport(doc(), 'https://x.com/page')
    expect(report.outline).toEqual([
      { level: 1, text: 'Main heading long enough for checks', problems: [] },
      { level: 3, text: 'Jumped level heading', problems: ['jump from h1'] },
      { level: 2, text: '', problems: ['empty'] },
    ])
  })

  it('extracts meta including og and hreflang', async () => {
    const report = await buildPageReport(doc(), 'https://x.com/page')
    expect(report.meta.title).toContain('well sized')
    expect(report.meta['og:title']).toBe('OG title')
    expect(report.meta.canonical).toBe('https://x.com/page')
    expect(report.meta['hreflang:en']).toBe('https://x.com/en/page')
  })

  it('validates jsonld blocks', async () => {
    const report = await buildPageReport(doc(), 'https://x.com/page')
    expect(report.jsonLd).toHaveLength(2)
    expect(report.jsonLd[0]).toMatchObject({ type: 'Product', valid: true })
    expect(report.jsonLd[1]).toMatchObject({ type: 'Article', valid: false })
  })

  it('runs level-1 checks without network', async () => {
    const report = await buildPageReport(doc(), 'https://x.com/page')
    const ids = new Set(report.issues.map(i => i.checkId))
    expect(ids).toContain('headings:hierarchy')
    expect(ids).toContain('headings:no-empty')
    expect(ids).not.toContain('links:no-broken')
    expect(ids).not.toContain('canonical:valid')
  })
})

describe('collectInternalLinks', () => {
  it('dedupes same-origin urls, drops hash, external and non-http', () => {
    const links = collectInternalLinks(doc(), 'https://x.com/page')
    expect(links).toEqual([
      { href: '/about', count: 2 },
      { href: '/pricing?plan=pro', count: 1 },
    ])
  })
})

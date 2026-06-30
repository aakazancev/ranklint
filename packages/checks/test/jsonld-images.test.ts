import { describe, expect, it } from 'vitest'
import { altRequired, dimensionsRequired, noLazyAboveFold } from '../src/checks/images/images'
import { jsonldParseable, jsonldValidSchema } from '../src/checks/jsonld/jsonld'
import { runCheckOnHtml } from '../src/test-utils'

function body(content: string): string {
  return `<html><body>${content}</body></html>`
}

describe('jsonld:parseable', () => {
  it('flags broken json, passes valid', async () => {
    const html = `<html><head>
      <script type="application/ld+json">{not json</script>
      <script type="application/ld+json">{"@type":"Organization","name":"X"}</script>
    </head><body></body></html>`
    const issues = await runCheckOnHtml(jsonldParseable, html)
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('not valid JSON')
  })
})

describe('jsonld:valid-schema', () => {
  it('flags schema violations with type and path', async () => {
    const html = `<html><head><script type="application/ld+json">{"@type":"Article"}</script></head><body></body></html>`
    const issues = await runCheckOnHtml(jsonldValidSchema, html)
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('Article: headline')
  })

  it('skips unparseable blocks and passes valid ones', async () => {
    const html = `<html><head>
      <script type="application/ld+json">broken</script>
      <script type="application/ld+json">{"@type":"WebSite","name":"X","url":"https://x.com"}</script>
    </head><body></body></html>`
    expect(await runCheckOnHtml(jsonldValidSchema, html)).toEqual([])
  })
})

describe('images checks', () => {
  it('alt-required flags images without alt, allows empty alt', async () => {
    const issues = await runCheckOnHtml(altRequired, body('<img src="/a.png"><img src="/b.png" alt="">'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('img[src="/a.png"]')
  })

  it('dimensions-required needs both width and height', async () => {
    const issues = await runCheckOnHtml(dimensionsRequired, body('<img src="/a.png" width="10"><img src="/b.png" width="10" height="10">'))
    expect(issues).toHaveLength(1)
  })

  it('no-lazy-above-fold flags lazy among first images only', async () => {
    const imgs = '<img src="/1.png" loading="lazy"><img src="/2.png"><img src="/3.png"><img src="/4.png" loading="lazy">'
    const issues = await runCheckOnHtml(noLazyAboveFold, body(imgs))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.selector).toBe('img[src="/1.png"]')
  })
})

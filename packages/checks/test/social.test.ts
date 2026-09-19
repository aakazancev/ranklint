import { describe, expect, it } from 'vitest'
import { ogRequired, twitterCard } from '../src/checks/meta/social'
import { runCheckOnHtml } from '../src/test-utils'

function head(meta: string): string {
  return `<html><head>${meta}</head><body></body></html>`
}

const fullOg = '<meta property="og:title" content="T">'
  + '<meta property="og:description" content="D">'
  + '<meta property="og:image" content="https://x.com/og.png">'

describe('meta:og-required', () => {
  it('passes with complete absolute og tags', async () => {
    expect(await runCheckOnHtml(ogRequired, head(fullOg))).toEqual([])
  })

  it('reports all missing og tags in one issue', async () => {
    const issues = await runCheckOnHtml(ogRequired, head(''))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toBe('Page has no og:title, og:description, og:image')
    expect(issues[0]?.suggestion).toContain('useSeoMeta({ ogTitle, ogDescription, ogImage })')
  })

  it('lists only the missing tags', async () => {
    const issues = await runCheckOnHtml(ogRequired, head('<meta property="og:title" content="T">'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toBe('Page has no og:description, og:image')
  })

  it('flags relative og:image', async () => {
    const issues = await runCheckOnHtml(ogRequired, head(fullOg.replace('https://x.com/og.png', '/og.png')))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('absolute URL')
  })
})

describe('meta:twitter-card', () => {
  it('ignores pages without twitter:card and accepts valid cards', async () => {
    expect(await runCheckOnHtml(twitterCard, head(''))).toEqual([])
    expect(await runCheckOnHtml(twitterCard, head(`<meta name="twitter:card" content="summary">${fullOg}`))).toEqual([])
  })

  it('flags unknown card values', async () => {
    const issues = await runCheckOnHtml(twitterCard, head('<meta name="twitter:card" content="huge">'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('Unknown twitter:card')
  })

  it('requires an image for summary_large_image', async () => {
    const bare = await runCheckOnHtml(twitterCard, head('<meta name="twitter:card" content="summary_large_image">'))
    expect(bare).toHaveLength(1)
    const withTwitterImage = await runCheckOnHtml(twitterCard, head(
      '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://x.com/t.png">',
    ))
    expect(withTwitterImage).toEqual([])
    const withOgImage = await runCheckOnHtml(twitterCard, head(
      `<meta name="twitter:card" content="summary_large_image">${fullOg}`,
    ))
    expect(withOgImage).toEqual([])
  })
})

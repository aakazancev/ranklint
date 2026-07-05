import type { PageSnapshot } from '../src/types'
import { describe, expect, it } from 'vitest'
import { analyzeCrawlBudget } from '../src/crawl-budget'

function snap(url: string, head = ''): PageSnapshot {
  return {
    url,
    html: `<html><head>${head}</head><body></body></html>`,
    statusCode: 200,
    headers: {},
    ttfb: 1,
    links: [],
  }
}

const canonical = '<link rel="canonical" href="https://x.com/catalog">'
const noindex = '<meta name="robots" content="noindex, follow">'

describe('analyzeCrawlBudget', () => {
  it('groups parametric urls and counts canonical/noindex coverage', () => {
    const report = analyzeCrawlBudget([
      snap('https://x.com/catalog?color=red', canonical),
      snap('https://x.com/catalog?color=blue', canonical),
      snap('https://x.com/catalog?color=red&size=xl'),
      snap('https://x.com/search?q=shoes', noindex),
      snap('https://x.com/about'),
    ])
    expect(report?.parametricUrls).toBe(4)
    expect(report?.junkUrls).toBe(1)
    expect(report?.groups).toHaveLength(3)
    const colorGroup = report?.groups.find(g => g.params.join() === 'color')
    expect(colorGroup).toMatchObject({ pattern: '/catalog', count: 2, withCanonical: 2, withNoindex: 0 })
    const junkGroup = report?.groups.find(g => g.params.join() === 'color,size')
    expect(junkGroup).toMatchObject({ count: 1, withCanonical: 0, withNoindex: 0 })
  })

  it('returns undefined without parametric urls', () => {
    expect(analyzeCrawlBudget([snap('https://x.com/'), snap('https://x.com/about')])).toBeUndefined()
  })
})

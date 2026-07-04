import { describe, expect, it } from 'vitest'
import { routePatternOf, sampleUrls } from '../src/sample'

describe('routePatternOf', () => {
  it('generalizes numeric, uuid and hashed segments', () => {
    expect(routePatternOf('/listing/12345')).toBe('/listing/*')
    expect(routePatternOf('/p/3fa85f64-5717-4562-b3fc-2c963f66afa6')).toBe('/p/*')
    expect(routePatternOf('/about')).toBe('/about')
    expect(routePatternOf('/blog/my-post-2024-review')).toBe('/blog/*')
    expect(routePatternOf('/')).toBe('/')
  })
})

describe('sampleUrls', () => {
  it('keeps structural pages and samples N per pattern group', () => {
    const urls = [
      'https://x.com/',
      'https://x.com/about',
      ...Array.from({ length: 20 }, (_, i) => `https://x.com/listing/${i}`),
    ]
    const sampled = sampleUrls(urls, 3)
    expect(sampled).toContain('https://x.com/')
    expect(sampled).toContain('https://x.com/about')
    expect(sampled.filter(u => u.includes('/listing/'))).toHaveLength(3)
  })
})

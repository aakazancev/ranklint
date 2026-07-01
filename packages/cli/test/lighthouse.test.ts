import { describe, expect, it } from 'vitest'
import { aggregate, checkThresholds, collectLighthouse, type LighthouseRunner } from '../src/lighthouse'

describe('aggregate', () => {
  it('median and p75', () => {
    expect(aggregate([90, 70, 80], 'median', 'performance')).toBe(80)
    expect(aggregate([100, 200, 300, 400], 'p75', 'lcp')).toBe(300)
  })

  it('best is max for scores, min for timings', () => {
    expect(aggregate([70, 90, 80], 'best', 'performance')).toBe(90)
    expect(aggregate([2500, 2100, 2300], 'best', 'lcp')).toBe(2100)
  })
})

describe('collectLighthouse', () => {
  it('runs N times per url and aggregates each metric', async () => {
    const calls: string[] = []
    let run = 0
    const runner: LighthouseRunner = async (url) => {
      calls.push(url)
      run++
      return { metrics: { performance: 70 + run * 10, lcp: 2000 + run * 100 } }
    }
    const results = await collectLighthouse(['https://x.com/'], { runs: 3, aggregation: 'median' }, runner)
    expect(calls).toHaveLength(3)
    expect(results[0]?.metrics.performance).toBe(90)
    expect(results[0]?.metrics.lcp).toBe(2200)
  })

  it('respects maxUrls and derives lcp element suggestion', async () => {
    const runner: LighthouseRunner = async () => ({
      metrics: { performance: 90 },
      lcpSnippet: '<img src="/hero.jpg">',
    })
    const results = await collectLighthouse(['https://x.com/a', 'https://x.com/b'], { runs: 1, maxUrls: 1 }, runner)
    expect(results).toHaveLength(1)
    expect(results[0]?.lcpElement?.type).toBe('image')
    expect(results[0]?.lcpElement?.suggestion).toContain('fetchpriority')
  })
})

describe('checkThresholds', () => {
  const results = [
    {
      url: 'https://x.com/listing/42',
      runs: 1,
      aggregation: 'median' as const,
      metrics: { performance: 75, lcp: 2700 },
    },
    {
      url: 'https://x.com/',
      runs: 1,
      aggregation: 'median' as const,
      metrics: { performance: 95, lcp: 1500 },
    },
  ]

  it('applies most specific pattern with score >= and timing <= semantics', () => {
    const issues = checkThresholds(results, {
      '/': { performance: 90, lcp: 2000 },
      '/listing/**': { performance: 80, lcp: 2500 },
    })
    expect(issues).toHaveLength(2)
    expect(issues.map(i => i.message).join('\n')).toContain('performance is 75')
    expect(issues.map(i => i.message).join('\n')).toContain('lcp is 2700')
  })

  it('passes within thresholds and without config', () => {
    expect(checkThresholds(results, { '/**': { performance: 70, lcp: 3000 } })).toEqual([])
    expect(checkThresholds(results, undefined)).toEqual([])
  })
})

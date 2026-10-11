import { describe, expect, it } from 'vitest'
import { aggregate, checkThresholds, collectLighthouse, lighthouseTargets, type LighthouseRunner } from '../src/lighthouse'

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

  it('reports every run through onRun in order', async () => {
    const runner: LighthouseRunner = async url => ({ metrics: { performance: url.endsWith('/a') ? 50 : 90 } })
    const events: string[] = []
    await collectLighthouse(['https://x.com/a', 'https://x.com/b', 'https://x.com/c'], { runs: 2, maxUrls: 2 }, runner, (e) => {
      expect(e.ms).toBeGreaterThanOrEqual(0)
      events.push(`${e.page}/${e.pages} ${e.run}/${e.runs} ${e.metrics.performance} ${e.url}`)
    })
    expect(events).toEqual([
      '1/2 1/2 50 https://x.com/a',
      '1/2 2/2 50 https://x.com/a',
      '2/2 1/2 90 https://x.com/b',
      '2/2 2/2 90 https://x.com/b',
    ])
  })

  it('skips failed runs and aggregates the rest', async () => {
    let call = 0
    const runner: LighthouseRunner = async () => {
      call++
      if (call === 2) throw new Error('Target closed')
      return { metrics: { performance: call === 1 ? 60 : 80 } }
    }
    const events: string[] = []
    const results = await collectLighthouse(['https://x.com/'], { runs: 3, aggregation: 'best' }, runner, (e) => {
      events.push(`${e.run}/${e.runs} ${e.error ?? e.metrics.performance}`)
    })
    expect(events).toEqual(['1/3 60', '2/3 Target closed', '3/3 80'])
    expect(results).toHaveLength(1)
    expect(results[0]!.metrics.performance).toBe(80)
    expect(results[0]!.runs).toBe(2)
  })

  it('omits a url whose runs all failed and keeps measuring others', async () => {
    const runner: LighthouseRunner = async (url) => {
      if (url.endsWith('/a')) return Promise.reject(new Error('Protocol error'))
      return { metrics: { performance: 90 } }
    }
    const errors: string[] = []
    const results = await collectLighthouse(['https://x.com/a', 'https://x.com/b'], { runs: 2 }, runner, (e) => {
      if (e.error) errors.push(`${e.run} ${e.error} ${e.url}`)
    })
    expect(errors).toEqual(['1 Protocol error https://x.com/a', '2 Protocol error https://x.com/a'])
    expect(results.map(r => r.url)).toEqual(['https://x.com/b'])
    expect(results[0]!.metrics.performance).toBe(90)
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

describe('lighthouseTargets', () => {
  const discovered = ['https://x.com/', 'https://x.com/a', 'https://x.com/b', 'https://x.com/c', 'https://x.com/d', 'https://x.com/e']

  it('takes the first discovered urls up to maxUrls or 5', () => {
    expect(lighthouseTargets('https://x.com/', undefined, discovered)).toEqual(discovered.slice(0, 5))
    expect(lighthouseTargets('https://x.com/', { maxUrls: 2 }, discovered)).toEqual(discovered.slice(0, 2))
  })

  it('uses configured urls in order, resolved against the base', () => {
    const urls = ['/pricing', 'https://other.com/x', 'en/blog']
    expect(lighthouseTargets('https://x.com/root/', { urls }, discovered)).toEqual([
      'https://x.com/pricing',
      'https://other.com/x',
      'https://x.com/root/en/blog',
    ])
  })

  it('treats an empty urls list as not set', () => {
    expect(lighthouseTargets('https://x.com/', { urls: [], maxUrls: 2 }, discovered)).toEqual(discovered.slice(0, 2))
  })

  it('caps configured urls with maxUrls when set', () => {
    const urls = ['/1', '/2', '/3', '/4', '/5', '/6', '/7']
    expect(lighthouseTargets('https://x.com', { urls }, [])).toHaveLength(7)
    expect(lighthouseTargets('https://x.com', { urls, maxUrls: 3 }, [])).toEqual(['https://x.com/1', 'https://x.com/2', 'https://x.com/3'])
  })
})

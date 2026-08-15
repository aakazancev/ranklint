import { describe, expect, it } from 'vitest'
import { getDocument, runChecks, type RunnerInput } from '../src/runner'
import type { Check, PageFetcher, PageSnapshot, RuleSetting } from '../src/types'

const fetcher: PageFetcher = {
  fetch: async url => snap(url, ''),
  head: async () => ({ statusCode: 200, headers: {} }),
  close: async () => {},
}

function snap(url: string, html: string): PageSnapshot {
  return { url, html, statusCode: 200, headers: {}, ttfb: 1, links: [] }
}

function baseInput(overrides: Partial<RunnerInput>): RunnerInput {
  return {
    snapshots: [],
    checks: [],
    rules: new Map<string, RuleSetting>(),
    site: { url: 'https://x.com' },
    fetcher,
    crawlStats: { visited: 0, skipped: 0, external: 0, ignored: 0 },
    ...overrides,
  }
}

const h1Check: Check = {
  id: 'headings:single-h1',
  category: 'headings',
  severity: 'error',
  scope: 'page',
  run: async (ctx) => {
    const count = ctx.document!.querySelectorAll('h1').length
    return count === 1
      ? []
      : [{ checkId: 'headings:single-h1', severity: 'error', message: `${count} h1`, url: ctx.page!.url }]
  },
}

describe('runChecks', () => {
  it('runs page checks against lazy DOM and stamps severity from rules', async () => {
    const report = await runChecks(baseInput({
      snapshots: [snap('https://x.com/', '<html><body></body></html>')],
      checks: [h1Check],
      rules: new Map([['headings:single-h1', { severity: 'warn', options: {} }]]),
    }))
    expect(report.issues).toHaveLength(1)
    expect(report.issues[0]?.severity).toBe('warn')
    expect(report.formatVersion).toBe(1)
    expect(report.meta.pagesAudited).toBe(1)
  })

  it('skips rules set to off', async () => {
    const report = await runChecks(baseInput({
      snapshots: [snap('https://x.com/', '<html></html>')],
      checks: [h1Check],
      rules: new Map<string, RuleSetting>([['headings:single-h1', 'off']]),
    }))
    expect(report.issues).toHaveLength(0)
  })

  it('honors ranklint:ignore meta per page and counts it', async () => {
    const html = '<html><head><meta name="ranklint:ignore" content="headings:single-h1"></head><body></body></html>'
    const report = await runChecks(baseInput({
      snapshots: [snap('https://x.com/', html), snap('https://x.com/other', '<html></html>')],
      checks: [h1Check],
    }))
    expect(report.issues.map(i => i.url)).toEqual(['https://x.com/other'])
    expect(report.crawlStats.ignored).toBe(1)
  })

  it('converts check throw into internal:check-failed and continues', async () => {
    const bomb: Check = { ...h1Check, id: 'meta:bomb', run: async () => { throw new Error('kaboom') } }
    const report = await runChecks(baseInput({
      snapshots: [snap('https://x.com/', '<html></html>')],
      checks: [bomb, h1Check],
    }))
    const ids = report.issues.map(i => i.checkId).sort()
    expect(ids).toEqual(['headings:single-h1', 'internal:check-failed'])
    expect(report.issues.find(i => i.checkId === 'internal:check-failed')?.severity).toBe('info')
  })

  it('runs site-scope checks once with all pages', async () => {
    const calls: number[] = []
    const dup: Check = {
      id: 'meta:no-duplicate-title',
      category: 'meta',
      severity: 'error',
      scope: 'site',
      run: async (ctx) => {
        calls.push(ctx.pages!.length)
        return []
      },
    }
    await runChecks(baseInput({
      snapshots: [snap('https://x.com/a', ''), snap('https://x.com/b', '')],
      checks: [dup],
    }))
    expect(calls).toEqual([2])
  })

  it('includes crawl issues in report', async () => {
    const report = await runChecks(baseInput({
      crawlIssues: [{ checkId: 'crawl:timeout', severity: 'warn', message: 't', url: 'https://x.com/slow' }],
    }))
    expect(report.issues).toHaveLength(1)
  })

  it('caches parsed documents per snapshot', () => {
    const s = snap('https://x.com/', '<html><body><h1>t</h1></body></html>')
    expect(getDocument(s)).toBe(getDocument(s))
  })
})

describe('failed snapshots', () => {
  it('skips page checks for snapshots with statusCode 0', async () => {
    const dead: PageSnapshot = { url: 'https://x.com/dead', html: '', statusCode: 0, headers: {}, ttfb: 0, links: [] }
    const report = await runChecks(baseInput({ snapshots: [dead], checks: [h1Check] }))
    expect(report.issues).toEqual([])
    expect(report.meta.pagesAudited).toBe(1)
  })
})

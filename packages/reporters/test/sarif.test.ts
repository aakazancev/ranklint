import type { Report } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { reporters, sarif } from '../src/index'

function report(overrides: Partial<Report> = {}): Report {
  return {
    formatVersion: 1,
    meta: { url: 'https://x.com', timestamp: '2026-07-01T00:00:00Z', pagesAudited: 2 },
    issues: [
      {
        checkId: 'meta:title-length',
        severity: 'warn',
        message: 'Title is 4 chars',
        url: 'https://x.com/a',
        suggestion: 'Make it longer',
        docs: 'https://ranklint.dev/en/rules#meta-title-length',
      },
      {
        checkId: 'meta:title-length',
        severity: 'info',
        message: 'Title is 5 chars',
        url: 'https://x.com/b',
      },
      {
        checkId: 'headings:single-h1',
        severity: 'error',
        message: 'Page has 2 <h1>',
        url: 'https://x.com/b',
        selector: 'main > h1',
      },
    ],
    crawlStats: { visited: 2, skipped: 0, external: 0, ignored: 0 },
    ...overrides,
  }
}

describe('sarif reporter', () => {
  it('emits a parsable sarif 2.1.0 document with one run', () => {
    const doc = JSON.parse(sarif(report()))
    expect(doc.version).toBe('2.1.0')
    expect(doc.$schema).toBe('https://json.schemastore.org/sarif-2.1.0.json')
    expect(doc.runs).toHaveLength(1)
    expect(doc.runs[0].tool.driver.name).toBe('ranklint')
    expect(doc.runs[0].tool.driver.informationUri).toBe('https://ranklint.dev')
  })

  it('lists rules once per checkId with docs as helpUri', () => {
    const doc = JSON.parse(sarif(report()))
    const rules = doc.runs[0].tool.driver.rules
    expect(rules.map((r: { id: string }) => r.id)).toEqual(['meta:title-length', 'headings:single-h1'])
    expect(rules[0].shortDescription.text).toBe('meta:title-length')
    expect(rules[0].helpUri).toBe('https://ranklint.dev/en/rules#meta-title-length')
    expect(rules[1].helpUri).toBeUndefined()
  })

  it('maps severities to sarif levels', () => {
    const levels = JSON.parse(sarif(report())).runs[0].results.map((r: { level: string }) => r.level)
    expect(levels).toEqual(['warning', 'note', 'error'])
  })

  it('renders message, location and selector', () => {
    const results = JSON.parse(sarif(report())).runs[0].results
    expect(results[0].ruleId).toBe('meta:title-length')
    expect(results[0].message.text).toBe('Title is 4 chars Make it longer')
    expect(results[1].message.text).toBe('Title is 5 chars')
    expect(results[0].locations[0].physicalLocation.artifactLocation.uri).toBe('https://x.com/a')
    expect(results[2].properties.selector).toBe('main > h1')
    expect(results[0].properties).toBeUndefined()
  })

  it('keeps fingerprints stable across runs and distinct per issue', () => {
    const first = JSON.parse(sarif(report())).runs[0].results
    const second = JSON.parse(sarif(report())).runs[0].results
    const fp = (r: { partialFingerprints: { primaryLocationLineHash: string } }) => r.partialFingerprints.primaryLocationLineHash
    expect(first.map(fp)).toEqual(second.map(fp))
    expect(new Set(first.map(fp)).size).toBe(3)
  })

  it('handles an empty report', () => {
    const doc = JSON.parse(sarif(report({ issues: [] })))
    expect(doc.runs[0].results).toEqual([])
    expect(doc.runs[0].tool.driver.rules).toEqual([])
  })

  it('is registered under the sarif name', () => {
    expect(reporters.sarif).toBe(sarif)
  })
})

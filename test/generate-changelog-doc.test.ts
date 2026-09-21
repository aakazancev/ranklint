import { describe, expect, it } from 'vitest'
import { firstParagraph, mergeChangelogs, parseChangelog, readDate, renderIndex, renderVersionPage, resolveDate } from '../scripts/generate-changelog-doc.mjs'

const core = `# @ranklint/core

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API

## 0.4.1

## 0.4.0

### Minor Changes

- 27f2451: Add crawl.entry option
`

const cli = `# @ranklint/cli

## 1.0.0

### Major Changes

- 3f5d9fb: ranklint 1.0.0: stable public API

### Patch Changes

- Updated dependencies [3f5d9fb]
  - @ranklint/core@1.0.0

## 0.4.1

### Patch Changes

- Fix watch exit code
- 6b7a0e1: Fix zone classification
  - @ranklint/core@0.4.1
`

const reporters = `# @ranklint/reporters

## 0.4.1

### Patch Changes

- @ranklint/core@0.4.1
`

describe('parseChangelog', () => {
  it('splits versions, groups and bullets with optional hash', () => {
    const versions = parseChangelog(cli)
    expect(versions.map(v => v.version)).toEqual(['1.0.0', '0.4.1'])
    expect(versions[0]!.groups.major).toEqual([{ hash: '3f5d9fb', text: 'ranklint 1.0.0: stable public API' }])
    expect(versions[1]!.groups.patch).toEqual([{ hash: null, text: 'Fix watch exit code' }, { hash: '6b7a0e1', text: 'Fix zone classification' }])
  })

  it('drops Updated dependencies bullets and their children', () => {
    expect(parseChangelog(cli)[0]!.groups.patch).toEqual([])
  })

  it('drops bare dependency bump bullets', () => {
    expect(parseChangelog(reporters)[0]!.groups.patch).toEqual([])
  })
})

describe('mergeChangelogs', () => {
  const merged = mergeChangelogs([{ pkg: '@ranklint/core', text: core }, { pkg: '@ranklint/cli', text: cli }, { pkg: '@ranklint/reporters', text: reporters }])

  it('dedupes by hash across packages and records package names', () => {
    const v1 = merged.find(v => v.version === '1.0.0')!
    expect(v1.entries).toHaveLength(1)
    expect(v1.entries[0]).toEqual({ kind: 'breaking', hash: '3f5d9fb', text: 'ranklint 1.0.0: stable public API', packages: ['@ranklint/core', '@ranklint/cli'] })
  })

  it('maps groups to kinds and keeps hashless entries', () => {
    const v041 = merged.find(v => v.version === '0.4.1')!
    expect(v041.entries).toEqual([
      { kind: 'fix', hash: null, text: 'Fix watch exit code', packages: ['@ranklint/cli'] },
      { kind: 'fix', hash: '6b7a0e1', text: 'Fix zone classification', packages: ['@ranklint/cli'] },
    ])
    expect(merged.find(v => v.version === '0.4.0')!.entries[0]!.kind).toBe('feature')
  })

  it('sorts semver descending and drops empty versions', () => {
    expect(merged.map(v => v.version)).toEqual(['1.0.0', '0.4.1', '0.4.0'])
    expect(mergeChangelogs([{ pkg: 'x', text: '# x\n\n## 0.2.0\n\n## 0.1.0\n\n### Patch Changes\n\n- a\n' }]).map(v => v.version)).toEqual(['0.1.0'])
  })

  it('keeps two bullets sharing a hash in one package', () => {
    const a = '# a\n\n## 2.0.0\n\n### Minor Changes\n\n- abc1234: First change\n- abc1234: Second change\n'
    const b = '# b\n\n## 2.0.0\n\n### Minor Changes\n\n- abc1234: First change\n'
    expect(mergeChangelogs([{ pkg: 'a', text: a }, { pkg: 'b', text: b }])[0]!.entries).toEqual([
      { kind: 'feature', hash: 'abc1234', text: 'First change', packages: ['a', 'b'] },
      { kind: 'feature', hash: 'abc1234', text: 'Second change', packages: ['a'] },
    ])
  })
})

describe('resolveDate', () => {
  it('takes the earliest commit date when git knows the version', () => {
    expect(resolveDate(['2026-09-21', '2026-08-15'], false, '0.1.0')).toBe('2026-08-15')
  })

  it('falls back to today for the newest version released but not yet committed', () => {
    expect(resolveDate([], true, '1.1.0')).toBe(new Date().toISOString().slice(0, 10))
  })

  it('throws for an older version with no commit', () => {
    expect(() => resolveDate([], false, '0.3.0')).toThrow('0.3.0')
  })
})

describe('tails', () => {
  it('firstParagraph skips headings and blank lines', () => {
    expect(firstParagraph('\n\n## Highlights\n\nFirst para line.\nSecond line.\n\nNext para\n')).toBe('First para line. Second line.')
    expect(firstParagraph('')).toBe('')
  })

  it('readDate reads a frontmatter date', () => {
    expect(readDate('---\ntitle: "x"\ndate: 2026-09-01\n---\n\nbody')).toBe('2026-09-01')
    expect(readDate(undefined)).toBeUndefined()
  })
})

describe('render', () => {
  const v = { version: '1.0.0', entries: [{ kind: 'breaking' as const, hash: '3f5d9fb', text: 'Stable `API`: [done](https://x.com/a)', packages: ['@ranklint/core'] }] }

  it('renders a version page with quoted frontmatter and grouped entries', () => {
    const { frontmatter, generated } = renderVersionPage(v, '2026-09-21', 'en', ['@ranklint/core', '@ranklint/cli'])
    expect(frontmatter).toContain('title: "ranklint 1.0.0 release notes"')
    expect(frontmatter).toContain('description: "Stable API: done"')
    expect(frontmatter).toContain('date: 2026-09-21')
    expect(frontmatter).toContain('navigation: false')
    expect(generated).toContain('## Breaking')
    expect(generated).not.toContain('### Breaking')
    expect(generated).toContain('**@ranklint/core**: Stable `API`: [done](https://x.com/a) ([3f5d9fb](https://github.com/aakazancev/ranklint/commit/3f5d9fb))')
  })

  it('omits the package badge when an entry touches every package', () => {
    const { generated } = renderVersionPage(v, '2026-09-21', 'en', ['@ranklint/core'])
    expect(generated).not.toContain('**@ranklint/core**')
  })

  it('renders ru headings, title and a counted description', () => {
    const { frontmatter, generated } = renderVersionPage(v, '2026-09-21', 'ru', ['@ranklint/core'])
    expect(frontmatter).toContain('title: "ranklint 1.0.0: что изменилось"')
    expect(frontmatter).toContain('description: "Что изменилось в ranklint 1.0.0: 1 записей, полный список правок релиза."')
    expect(generated).toContain('## Ломающие изменения')
  })

  it('wraps ru bullet lists in an english language block', () => {
    const { generated } = renderVersionPage(v, '2026-09-21', 'ru', ['@ranklint/core'])
    expect(generated).toContain('::div{lang="en"}')
    expect(generated.indexOf('## Ломающие изменения')).toBeLessThan(generated.indexOf('::div{lang="en"}'))
    expect(generated).toContain('Дата: 2026-09-21')
    expect(generated.indexOf('Дата: 2026-09-21')).toBeLessThan(generated.indexOf('::div{lang="en"}'))
    expect(renderVersionPage(v, '2026-09-21', 'en', ['@ranklint/core']).generated).not.toContain('::div')
  })

  it('renders the index newest first with a link line under each heading', () => {
    const out = renderIndex([{ version: '1.0.0', date: '2026-09-21', summary: 'Stable', fromTail: true }, { version: '0.5.0', date: '2026-09-19', summary: 'Progress', fromTail: false }], 'en')
    expect(out.indexOf('v1.0.0')).toBeLessThan(out.indexOf('v0.5.0'))
    expect(out).toContain('## ranklint 1.0.0')
    expect(out).not.toContain('## [ranklint 1.0.0]')
    expect(out).toContain('Released: 2026-09-21 · [Release notes](/en/changelog/v1.0.0)')
    expect(out).toContain('<!-- generated:start -->')
  })

  it('renders the ru index and wraps only summaries taken from changesets', () => {
    const out = renderIndex([{ version: '1.0.0', date: '2026-09-21', summary: 'Стабильно', fromTail: true }, { version: '0.5.0', date: '2026-09-19', summary: 'Progress', fromTail: false }], 'ru')
    expect(out).toContain('title: "Изменения и релизы ranklint"')
    expect(out).toContain('Дата: 2026-09-21 · [Подробнее](/ru/changelog/v1.0.0)')
    expect(out).toContain('::div{lang="en"}\n\nProgress\n\n::')
    expect(out).not.toContain('::div{lang="en"}\n\nСтабильно')
  })

  it('gives both index pages a description of 70 to 160 characters', () => {
    for (const locale of ['en', 'ru'] as const) {
      const description = renderIndex([{ version: '1.0.0', date: '2026-09-21', summary: 'x', fromTail: true }], locale).match(/description: "(.*)"/)![1]!
      expect(description.length).toBeGreaterThanOrEqual(70)
      expect(description.length).toBeLessThanOrEqual(160)
    }
  })
})

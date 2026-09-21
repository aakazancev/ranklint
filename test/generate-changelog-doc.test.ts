import { describe, expect, it } from 'vitest'
import { firstParagraph, mergeChangelogs, parseChangelog, readDate, renderIndex, renderVersionPage } from '../scripts/generate-changelog-doc.mjs'

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
  const v = { version: '1.0.0', entries: [{ kind: 'breaking' as const, hash: '3f5d9fb', text: 'Stable API: done', packages: ['@ranklint/core'] }] }

  it('renders a version page with quoted frontmatter and grouped entries', () => {
    const { frontmatter, generated } = renderVersionPage(v, '2026-09-21', 'en', ['@ranklint/core', '@ranklint/cli'])
    expect(frontmatter).toContain('title: "ranklint 1.0.0"')
    expect(frontmatter).toContain('description: "Stable API: done"')
    expect(frontmatter).toContain('date: 2026-09-21')
    expect(frontmatter).toContain('navigation: false')
    expect(generated).toContain('### Breaking')
    expect(generated).toContain('**@ranklint/core**: Stable API: done ([3f5d9fb](https://github.com/aakazancev/ranklint/commit/3f5d9fb))')
  })

  it('omits the package badge when an entry touches every package', () => {
    const { generated } = renderVersionPage(v, '2026-09-21', 'en', ['@ranklint/core'])
    expect(generated).not.toContain('**@ranklint/core**')
  })

  it('renders ru headings', () => {
    expect(renderVersionPage(v, '2026-09-21', 'ru', ['@ranklint/core']).generated).toContain('### Ломающие изменения')
  })

  it('renders the index newest first with links to v-prefixed pages', () => {
    const out = renderIndex([{ version: '1.0.0', date: '2026-09-21', summary: 'Stable' }, { version: '0.5.0', date: '2026-09-19', summary: 'Progress' }], 'en')
    expect(out.indexOf('v1.0.0')).toBeLessThan(out.indexOf('v0.5.0'))
    expect(out).toContain('## [ranklint 1.0.0](/en/changelog/v1.0.0)')
    expect(out).toContain('<!-- generated:start -->')
  })
})

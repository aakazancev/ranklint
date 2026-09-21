import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.md') ? [path] : []
  })
}

function scalarLines(file: string): string[] {
  const match = readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---/)
  if (!match) return []
  return match[1]!.split('\n').filter(line => /^(title|description):/.test(line))
}

describe('docs frontmatter', () => {
  const files = walk(join(root, 'docs/content'))

  it('finds markdown pages', () => {
    expect(files.length).toBeGreaterThan(50)
  })

  it('quotes title and description values that contain a colon', () => {
    const broken = files.flatMap(file => scalarLines(file)
      .filter(line => /^(title|description): [^"'].*: /.test(line))
      .map(line => `${file.slice(root.length)}: ${line}`))
    expect(broken).toEqual([])
  })
})

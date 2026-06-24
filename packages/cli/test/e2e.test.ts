import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import type { Report } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { exitCodeFor } from '../src/exit-code'
import { runAudit } from '../src/run-audit'
import { startServer, type RunningServer } from '../src/start-server'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const manifest: Record<string, string[]> = JSON.parse(
  readFileSync(`${root}/playground/fixtures/manifest.json`, 'utf8'),
)

let server: RunningServer
let report: Report

beforeAll(async () => {
  execSync('pnpm --filter ranklint-playground build', { cwd: root, stdio: 'inherit' })
  server = await startServer(`${root}/playground/.output/server/index.mjs`)
  report = await runAudit({ url: server.url, cwd: `${root}/playground` })
}, 240_000)

afterAll(async () => {
  await server?.stop()
})

describe('e2e audit against fixture manifest', () => {
  it('finds every planted bug and nothing else on manifest pages', () => {
    const failures: string[] = []
    for (const [path, expected] of Object.entries(manifest)) {
      const found = new Set(
        report.issues
          .filter(issue => new URL(issue.url).pathname === path)
          .map(issue => issue.checkId),
      )
      const missing = expected.filter(id => !found.has(id))
      const unexpected = [...found].filter(id => !expected.includes(id))
      if (missing.length > 0) failures.push(`${path}: missing ${missing.join(', ')}`)
      if (unexpected.length > 0) failures.push(`${path}: unexpected ${unexpected.join(', ')}`)
    }
    expect(failures).toEqual([])
  })

  it('audits every manifest page', () => {
    const audited = new Set(report.issues.map(i => new URL(i.url).pathname))
    expect(report.meta.pagesAudited).toBeGreaterThanOrEqual(Object.keys(manifest).length)
    for (const path of Object.keys(manifest)) {
      if ((manifest[path] ?? []).length > 0) expect(audited).toContain(path)
    }
  })

  it('exits with code 1 because fixtures contain errors', () => {
    expect(exitCodeFor(report)).toBe(1)
  })
})

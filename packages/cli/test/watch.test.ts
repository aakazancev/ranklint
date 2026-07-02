import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Issue } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fileToRoute, formatIssues, runFastChecks, startWatch } from '../src/watch'

const buggyPage = '<html><head><title>Tiny</title></head><body><h1>a</h1><h1>b</h1></body></html>'

let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(buggyPage)
  })
  await new Promise<void>(r => server.listen(0, () => r()))
  const address = server.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

afterAll(() => new Promise<void>(r => server.close(() => r())))

describe('fileToRoute', () => {
  it('maps files to routes, skips dynamic and non-vue', () => {
    expect(fileToRoute('index.vue')).toBe('/')
    expect(fileToRoute('blog/index.vue')).toBe('/blog')
    expect(fileToRoute('bugs/title-short.vue')).toBe('/bugs/title-short')
    expect(fileToRoute('listing/[id].vue')).toBeNull()
    expect(fileToRoute('readme.md')).toBeNull()
  })
})

describe('runFastChecks', () => {
  it('runs page checks without network ones', async () => {
    const { HttpFetcher } = await import('@ranklint/core')
    const issues = await runFastChecks('/', base, new HttpFetcher())
    const ids = new Set(issues.map(i => i.checkId))
    expect(ids).toContain('headings:single-h1')
    expect(ids).toContain('meta:title-length')
    expect(ids).not.toContain('links:no-broken')
  })
})

describe('formatIssues', () => {
  it('renders eslint-style block and clean state', () => {
    const issue: Issue = { checkId: 'headings:single-h1', severity: 'error', message: '2 h1', url: 'x' }
    expect(formatIssues('/page', [issue])).toContain('error headings:single-h1')
    expect(formatIssues('/page', [])).toContain('clean')
  })
})

describe('startWatch', () => {
  it('reacts to a page file change with a report', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-watch-'))
    await mkdir(join(dir, 'bugs'), { recursive: true })
    const reported = new Promise<{ route: string, issues: Issue[] }>((resolve) => {
      const watcher = startWatch({
        pagesDir: dir,
        baseUrl: base,
        debounceMs: 50,
        onReport: (route, issues) => {
          watcher.close()
          resolve({ route, issues })
        },
      })
    })
    await new Promise(r => setTimeout(r, 300))
    await writeFile(join(dir, 'bugs', 'title-short.vue'), '<template><h1>x</h1></template>')
    const { route, issues } = await reported
    expect(route).toBe('/bugs/title-short')
    expect(issues.map(i => i.checkId)).toContain('headings:single-h1')
  }, 20_000)
})

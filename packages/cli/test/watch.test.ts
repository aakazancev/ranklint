import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Issue } from '@ranklint/core'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { fileToDynamicRoute, fileToRoute, formatIssues, runFastChecks, sitemapPaths, startWatch } from '../src/watch'

const buggyPage = '<html><head><title>Tiny</title></head><body><h1>a</h1><h1>b</h1></body></html>'

let server: Server
let base: string

beforeAll(async () => {
  server = createServer((req, res) => {
    if (req.url === '/sitemap.xml') {
      res.writeHead(200, { 'content-type': 'application/xml' })
      res.end(`<urlset><url><loc>${'http://x'}/listing/42</loc></url><url><loc>http://x/about</loc></url></urlset>`)
      return
    }
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

describe('fileToDynamicRoute', () => {
  it('builds matching regexes for params and catch-alls', () => {
    const listing = fileToDynamicRoute('listing/[id].vue')
    expect(listing?.pattern).toBe('/listing/[id]')
    expect(listing?.regex.test('/listing/42')).toBe(true)
    expect(listing?.regex.test('/listing/42/x')).toBe(false)
    const docs = fileToDynamicRoute('docs/[...slug].vue')
    expect(docs?.regex.test('/docs/a/b')).toBe(true)
    expect(docs?.regex.test('/docs')).toBe(false)
    expect(fileToDynamicRoute('about.vue')).toBeNull()
  })

  it('supports nuxt optional params and optional catch-alls', () => {
    const optional = fileToDynamicRoute('shop/[[category]].vue')
    expect(optional?.regex.test('/shop')).toBe(true)
    expect(optional?.regex.test('/shop/tools')).toBe(true)
    expect(optional?.regex.test('/shop/tools/deep')).toBe(false)
    const catchAll = fileToDynamicRoute('docs/[[...slug]].vue')
    expect(catchAll?.regex.test('/docs')).toBe(true)
    expect(catchAll?.regex.test('/docs/a/b')).toBe(true)
    const mixed = fileToDynamicRoute('blog/post-[id]-draft.vue')
    expect(mixed?.regex.test('/blog/post-42-draft')).toBe(true)
    expect(mixed?.regex.test('/blog/post--draft/x')).toBe(false)
  })

  it('returns null instead of throwing on unbalanced brackets', () => {
    expect(fileToDynamicRoute('x[.vue')).toBeNull()
  })
})

describe('dynamic routes in watch', () => {
  it('sitemapPaths extracts pathnames from sitemap', async () => {
    const { HttpFetcher } = await import('@ranklint/core')
    const fetcher = new HttpFetcher()
    expect(await sitemapPaths(base, fetcher)).toEqual(['/listing/42', '/about'])
    await fetcher.close()
  })

  it('sitemapPaths follows sitemap-index children', async () => {
    const indexServer = createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'application/xml' })
      if (req.url === '/sitemap.xml') {
        res.end('<sitemapindex><sitemap><loc>http://x/sitemap-pages.xml</loc></sitemap></sitemapindex>')
      } else {
        res.end('<urlset><url><loc>http://x/deep/1</loc></url></urlset>')
      }
    })
    await new Promise<void>(r => indexServer.listen(0, () => r()))
    const address = indexServer.address()
    const indexBase = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
    const { HttpFetcher } = await import('@ranklint/core')
    const fetcher = new HttpFetcher()
    expect(await sitemapPaths(indexBase, fetcher)).toEqual(['/deep/1'])
    await fetcher.close()
    await new Promise<void>(r => indexServer.close(() => r()))
  })

  it('checks sitemap-sampled urls when a dynamic page changes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-watch-dyn-'))
    await mkdir(join(dir, 'listing'), { recursive: true })
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
    await writeFile(join(dir, 'listing', '[id].vue'), '<template><h1>x</h1></template>')
    const { route, issues } = await reported
    expect(route).toBe('/listing/42')
    expect(issues.map(i => i.checkId)).toContain('headings:single-h1')
  }, 20_000)

  it('reports a warning when no sitemap url matches', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ranklint-watch-dyn2-'))
    await mkdir(join(dir, 'unknown'), { recursive: true })
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
    await writeFile(join(dir, 'unknown', '[slug].vue'), '<template><h1>x</h1></template>')
    const { route, issues } = await reported
    expect(route).toBe('/unknown/[slug]')
    expect(issues[0]?.checkId).toBe('watch:no-sample-url')
  }, 20_000)
})

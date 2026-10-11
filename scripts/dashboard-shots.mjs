import { execFileSync, execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url))
const { chromium } = require('playwright')

const PORT = 4310
const BASE = `http://127.0.0.1:${PORT}`
const PUBLIC_ORIGIN = 'https://example.com'
const cli = join(root, 'packages/cli/dist/cli.mjs')
const entry = join(root, 'playground/.output/server/index.mjs')
const work = join(tmpdir(), 'ranklint-dashboard-shots')
const reportsDir = join(work, 'reports')
const siteDir = join(work, 'site')
const shotsDir = join(root, 'docs/public/dashboard')
const MAX_BYTES = 300 * 1024
const sleep = ms => new Promise(r => setTimeout(r, ms))

const ogImageCheck = `{
  id: 'team:og-image-reachable',
  category: 'meta',
  severity: 'error',
  scope: 'page',
  async run(ctx) {
    const match = ctx.page.html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
    if (!match) return []
    const { statusCode } = await ctx.fetcher.head(match[1])
    if (statusCode < 400) return []
    return [{
      checkId: 'team:og-image-reachable',
      severity: 'error',
      message: 'og:image responds with ' + statusCode + ', link previews show no picture',
      url: ctx.page.url,
      selector: 'meta[property="og:image"]',
      suggestion: 'Upload the image or point og:image in useSeoMeta to a file that exists',
    }]
  },
}`

const runs = [
  { off: ['jsonld:parseable', 'jsonld:valid-schema', 'images:alt-required', 'images:dimensions-required', 'images:no-lazy-above-fold'], custom: false },
  { off: ['links:no-orphans', 'meta:no-duplicate-title', 'headings:hierarchy'], custom: true },
  { off: [], custom: true },
]

function configFor(run) {
  const rules = Object.fromEntries(run.off.map(id => [id, 'off']))
  return `export default {
  site: { url: '${BASE}' },
  rules: ${JSON.stringify(rules)},
  lighthouse: { enabled: true, runs: 1, urls: ['/', '/jsonld', '/bugs/images-bad', '/bugs/heading-jump'] },
  monitor: { storage: 'fs', dir: ${JSON.stringify(reportsDir)} },
  customChecks: [${run.custom ? ogImageCheck : ''}],
}
`
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await fetch(BASE).then(res => res.ok).catch(() => false)
    if (ok) return
    await sleep(300)
  }
  throw new Error('playground server did not start')
}

function rewrite(value) {
  if (typeof value === 'string') return value.split(BASE).join(PUBLIC_ORIGIN)
  if (Array.isArray(value)) return value.map(rewrite)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, rewrite(v)]))
  return value
}

function mornings(count) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (count - 1 - i), 7, 0, 0))
    return day.toISOString()
  })
}

function anonymize() {
  const files = readdirSync(reportsDir).filter(name => name.endsWith('.json'))
  const reports = files
    .map(name => ({ name, report: JSON.parse(readFileSync(join(reportsDir, name), 'utf8')) }))
    .sort((a, b) => a.report.meta.timestamp.localeCompare(b.report.meta.timestamp))
  const stamps = mornings(reports.length)
  reports.forEach(({ name, report }, i) => {
    const next = rewrite(report)
    next.meta.timestamp = stamps[i]
    const text = JSON.stringify(next)
    if (text.includes('127.0.0.1') || text.includes('localhost')) throw new Error(`${name} still mentions the local origin`)
    rmSync(join(reportsDir, name))
    const file = join(reportsDir, `${stamps[i].replace(/[^a-z0-9_.-]/gi, '_')}.json`)
    writeFileSync(file, text)
    const time = new Date(stamps[i])
    utimesSync(file, time, time)
  })
}

async function toWebp(page, png) {
  return page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/png;base64,${data}`
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d').drawImage(img, 0, 0)
    return canvas.toDataURL('image/webp', 0.82).split(',')[1]
  }, png.toString('base64'))
}

async function save(page, name, png) {
  const file = join(shotsDir, name)
  writeFileSync(file, Buffer.from(await toWebp(page, png), 'base64'))
  const size = await page.evaluate(async (data) => {
    const img = new Image()
    img.src = `data:image/webp;base64,${data}`
    await img.decode()
    return `${img.naturalWidth}x${img.naturalHeight}`
  }, readFileSync(file).toString('base64'))
  const bytes = statSync(file).size
  console.log(`${file} ${size} ${Math.round(bytes / 1024)} KB`)
  if (bytes > MAX_BYTES) throw new Error(`${file} is larger than 300 KB`)
}

async function shoot() {
  mkdirSync(shotsDir, { recursive: true })
  const index = `file://${join(siteDir, 'index.html')}`
  const browser = await chromium.launch()
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
    const page = await desktop.newPage()
    await page.goto(index, { waitUntil: 'networkidle' })
    await page.evaluate(() => document.fonts.ready)
    await save(page, 'dashboard-1440.webp', await page.screenshot())

    const sharp = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
    const detail = await sharp.newPage()
    await detail.goto(index, { waitUntil: 'networkidle' })
    await detail.evaluate(() => document.fonts.ready)
    await save(detail, 'dashboard-fix-once.webp', await detail.locator('.fixonce').first().screenshot())
    await detail.locator('#issues button[data-mode="page"]').click()
    const card = detail.locator('#issues details.page').first()
    await card.locator('summary').click()
    await card.locator('.todo').waitFor()
    await card.scrollIntoViewIfNeeded()
    const box = await card.boundingBox()
    const panel = await detail.locator('#issues').boundingBox()
    const pad = 16
    const clip = { x: panel.x, y: box.y, width: panel.width, height: box.height + pad }
    await save(detail, 'dashboard-page.webp', await detail.screenshot({ clip }))

    const phone = await browser.newContext({ viewport: { width: 393, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const mobile = await phone.newPage()
    await mobile.goto(index, { waitUntil: 'networkidle' })
    await mobile.evaluate(() => document.fonts.ready)
    await save(mobile, 'dashboard-393.webp', await mobile.screenshot())
  } finally {
    await browser.close()
  }
}

if (!process.argv.includes('--shots-only')) {
  if (!existsSync(entry) || process.argv.includes('--build')) {
    execSync('pnpm --filter ranklint-playground build', { cwd: root, stdio: 'inherit' })
  }
  rmSync(work, { recursive: true, force: true })
  mkdirSync(reportsDir, { recursive: true })

  const server = spawn('node', [entry], {
    cwd: root,
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', NITRO_PORT: String(PORT) },
  })

  try {
    await waitForServer(30_000)
    for (const [i, run] of runs.entries()) {
      const dir = join(work, `run-${i + 1}`)
      mkdirSync(dir, { recursive: true })
      writeFileSync(join(dir, 'ranklint.config.mjs'), configFor(run))
      execFileSync('node', [cli, 'audit', '--url', BASE, '--mode', 'monitor', '--cwd', dir, '--output', join(dir, 'diff.md')], { cwd: dir, stdio: 'inherit' })
    }
  } finally {
    if (server.pid) process.kill(-server.pid, 'SIGTERM')
  }

  anonymize()
}
rmSync(siteDir, { recursive: true, force: true })
execFileSync('node', [cli, 'dashboard', '--dir', reportsDir, '--out', siteDir], { stdio: 'inherit' })
await shoot()
console.log(`reports: ${reportsDir}\ndashboard: ${siteDir}`)

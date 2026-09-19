import { execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url))
const { chromium } = require('playwright')

const outDir = join(root, 'docs/public/landing')
const publicDir = join(root, 'docs/public')
const builtDir = join(root, 'docs/.output/public')
const playground = join(root, 'playground')
const entry = join(playground, '.output/server/index.mjs')
const PORT = 4181
const BASE = `http://localhost:${PORT}`
const DEVTOOLS_TOGGLE = 'nuxt-devtools-frame .nuxt-devtools-nuxt-button, nuxt-devtools-frame .nuxt-devtools-toggle'
const MAX_BYTES = 300 * 1024
const WIDE_VIEWPORT = { width: 1240, height: 1000 }
const NARROW_VIEWPORT = { width: 640, height: 1000 }
const OUTLINE_VIEWPORT = { width: 560, height: 900 }
const SCHEMES = ['light', 'dark']
const DEMO_PORT = 3000

const sleep = ms => new Promise(r => setTimeout(r, ms))

function ensureBuilt() {
  const needed = [
    join(root, 'packages/cli/dist/index.mjs'),
    join(root, 'packages/reporters/dist/index.mjs'),
    join(root, 'packages/devtools/dist/client/main.mjs'),
  ]
  if (needed.every(p => existsSync(p))) return
  execSync('pnpm build', { cwd: root, stdio: 'inherit' })
}

function report(file) {
  const bytes = statSync(file).size
  const kb = Math.round(bytes / 1024)
  console.log(`${file} - ${kb} KB${bytes > MAX_BYTES ? ' (over 300 KB limit!)' : ''}`)
  if (bytes > MAX_BYTES) throw new Error(`${file} is larger than 300 KB`)
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await fetch(`${BASE}/`).then(res => res.ok).catch(() => false)
    if (ok) return
    await sleep(500)
  }
  throw new Error('playground dev server did not start')
}

async function frameWith(page, urlPart, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => f.url().includes(urlPart))
    if (frame) return frame
    await sleep(300)
  }
  throw new Error(`frame "${urlPart}" did not appear`)
}

async function openPanel(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await page.waitForSelector(DEVTOOLS_TOGGLE, { state: 'attached', timeout: 60_000 })
  await page.locator(DEVTOOLS_TOGGLE).first().click({ force: true, timeout: 15_000 })
  const devtools = await frameWith(page, '__nuxt_devtools__')
  await devtools.goto(`${BASE}/__nuxt_devtools__/client/modules/custom-ranklint`)
  const deadline = Date.now() + 45_000
  while (Date.now() < deadline) {
    if (page.frames().some(f => f.url().includes('/__ranklint/devtools'))) break
    const getStarted = devtools.locator('a:has-text("Get Started")')
    if (await getStarted.count() > 0) {
      await getStarted.first().click()
      await sleep(1500)
      await devtools.goto(`${BASE}/__nuxt_devtools__/client/modules/custom-ranklint`)
    }
    await sleep(500)
  }
  const panel = await frameWith(page, '/__ranklint/devtools')
  await panel.waitForSelector('h2', { timeout: 30_000 })
  await panel.waitForFunction(
    expected => document.body.innerText.includes(expected),
    path,
    { timeout: 30_000 },
  )
  return panel
}

async function withPanel(browser, path, viewport, fn) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 })
  try {
    const page = await context.newPage()
    await fn(page, await openPanel(page, path))
  } finally {
    await context.close()
  }
}

async function hideToggle(page) {
  const toggle = page.locator(DEVTOOLS_TOGGLE).first()
  if (await toggle.count() > 0) await toggle.evaluate(el => (el.style.visibility = 'hidden'))
}

async function hideSections(panel, titles) {
  await panel.evaluate((hidden) => {
    for (const heading of [...document.querySelectorAll('h2')]) {
      if (!hidden.some(title => heading.textContent.startsWith(title))) continue
      heading.style.display = 'none'
      for (let node = heading.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) {
        node.style.display = 'none'
      }
    }
  }, titles)
}

async function sectionsClip(panel, first, last, pad = 14, maxHeight = Infinity) {
  const box = await (await panel.frameElement()).boundingBox()
  const rect = await panel.evaluate(([from, to]) => {
    const headings = [...document.querySelectorAll('h2')]
    const start = headings.find(h => h.textContent.startsWith(from))
    const end = headings.find(h => h.textContent.startsWith(to))
    if (!start || !end) return null
    let bottom = end.getBoundingClientRect().bottom
    for (let node = end.nextElementSibling; node && node.tagName !== 'H2'; node = node.nextElementSibling) {
      bottom = Math.max(bottom, node.getBoundingClientRect().bottom)
    }
    const left = start.getBoundingClientRect().left
    return { top: start.getBoundingClientRect().top, bottom, left, width: document.documentElement.clientWidth - left * 2 }
  }, [first, last])
  if (!rect) throw new Error(`sections "${first}" to "${last}" not found in the panel`)
  return {
    x: box.x + rect.left - pad,
    y: box.y + rect.top - pad,
    width: rect.width + pad * 2,
    height: Math.min(rect.bottom - rect.top + pad * 2, maxHeight),
  }
}

async function shootThemes(page, clip, name) {
  for (const scheme of SCHEMES) {
    await page.emulateMedia({ colorScheme: scheme })
    await sleep(300)
    const file = join(outDir, `${name}-${scheme}.png`)
    await page.screenshot({ path: file, clip })
    report(file)
  }
  console.log(`${name}: ${Math.round(clip.width)}x${Math.round(clip.height)} css px`)
}

async function devtoolsShots(browser) {
  const env = { ...process.env, NODE_ENV: 'development' }
  delete env.VITEST
  delete env.TEST
  delete env.NUXT_RANKLINT_ENV
  const server = spawn('npx', ['nuxt', 'dev', '--port', String(PORT)], {
    cwd: playground,
    stdio: 'ignore',
    detached: true,
    env,
  })
  try {
    await waitForServer(120_000)

    await withPanel(browser, '/bugs/images-bad', WIDE_VIEWPORT, async (page, panel) => {
      await panel.waitForFunction(() => document.body.innerText.includes('images:alt-required'), undefined, { timeout: 30_000 })
      await hideSections(panel, ['Links', 'JSON-LD'])
      await hideToggle(page)
      await shootThemes(page, await sectionsClip(panel, 'Issues', 'Meta', 16, 620), 'devtools')
    })

    await withPanel(browser, '/bugs/images-bad', NARROW_VIEWPORT, async (page, panel) => {
      await panel.waitForFunction(() => document.body.innerText.includes('images:alt-required'), undefined, { timeout: 30_000 })
      await hideToggle(page)
      await shootThemes(page, await sectionsClip(panel, 'Issues', 'Issues'), 'devtools-issues')
    })

    await withPanel(browser, '/bugs/heading-jump', OUTLINE_VIEWPORT, async (page, panel) => {
      await panel.waitForFunction(() => document.body.innerText.includes('headings:hierarchy'), undefined, { timeout: 30_000 })
      await hideToggle(page)
      await shootThemes(page, await sectionsClip(panel, 'Outline', 'Outline'), 'devtools-outline')
    })
  } finally {
    if (server.pid) process.kill(-server.pid, 'SIGTERM')
  }
}

async function reportShot(browser) {
  const { runAudit } = await import(new URL('../packages/cli/dist/index.mjs', import.meta.url).href)
  const { html } = await import(new URL('../packages/reporters/dist/index.mjs', import.meta.url).href)
  if (!existsSync(entry)) {
    execSync('pnpm --filter ranklint-playground build', { cwd: root, stdio: 'inherit' })
  }
  const url = `http://localhost:${DEMO_PORT}`
  const server = spawn('node', [entry], {
    env: { ...process.env, PORT: String(DEMO_PORT), HOST: 'localhost', NITRO_PORT: String(DEMO_PORT) },
    stdio: 'ignore',
  })
  let markup
  try {
    const deadline = Date.now() + 30_000
    while (Date.now() < deadline) {
      const ok = await fetch(url, { method: 'HEAD' }).then(() => true).catch(() => false)
      if (ok) break
      await sleep(300)
    }
    markup = html(await runAudit({ url, cwd: playground }))
  } finally {
    server.kill('SIGTERM')
  }
  const file = join(mkdtempSync(join(tmpdir(), 'ranklint-shots-')), 'report.html')
  writeFileSync(file, markup)

  const context = await browser.newContext({ viewport: { width: 760, height: 900 }, deviceScaleFactor: 2 })
  const page = await context.newPage()
  await page.goto(`file://${file}`, { waitUntil: 'load' })
  const out = join(outDir, 'report.png')
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 760, height: 340 } })
  report(out)
  await context.close()
}

async function iconShots(browser) {
  const nuxtDir = join(builtDir, '_nuxt')
  const css = existsSync(nuxtDir)
    ? readdirSync(nuxtDir).find(name => name.startsWith('entry.') && name.endsWith('.css'))
    : undefined
  if (!css) {
    console.log('icons skipped: build the docs first so Geist Mono is available offline')
    return
  }
  const page = join(builtDir, 'ranklint-icons.html')
  writeFileSync(page, `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="./_nuxt/${css}">
<style>
  body { margin: 0; display: flex; align-items: flex-start; gap: 24px; background: #ffffff; }
  .mark { display: grid; place-items: center; background: #0a0a0a; color: #10b981; font-family: 'Geist Mono', monospace; font-weight: 700; letter-spacing: -0.05em; }
  #mark-32 { width: 32px; height: 32px; font-size: 19px; }
  #mark-180 { width: 180px; height: 180px; font-size: 104px; }
  #mark-512 { width: 512px; height: 512px; font-size: 296px; }
</style>
<div class="mark" id="mark-32">rl</div>
<div class="mark" id="mark-180">rl</div>
<div class="mark" id="mark-512">rl</div>
`)
  const context = await browser.newContext({ viewport: { width: 900, height: 700 }, deviceScaleFactor: 1 })
  try {
    const tab = await context.newPage()
    await tab.goto(`file://${page}`, { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    for (const [id, file] of [['mark-32', 'favicon-32.png'], ['mark-180', 'apple-touch-icon.png'], ['mark-512', 'logo-512.png']]) {
      const out = join(publicDir, file)
      await tab.locator(`#${id}`).screenshot({ path: out })
      report(out)
    }
  } finally {
    await context.close()
    rmSync(page, { force: true })
  }
}

ensureBuilt()
mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  await devtoolsShots(browser)
  await reportShot(browser)
  await iconShots(browser)
} finally {
  await browser.close()
}

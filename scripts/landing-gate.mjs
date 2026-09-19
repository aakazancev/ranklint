import { execSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url))
const { chromium } = require('playwright')

const PORT = 4100
const BASE = `http://127.0.0.1:${PORT}`
const entry = join(root, 'docs/.output/server/index.mjs')
const shotsDir = join(root, 'docs/superpowers/shots/gate')
const nuxtDir = join(root, 'docs/.output/public/_nuxt')
const LOCALES = ['en', 'ru']
const WIDTHS = [390, 768, 1024, 1280, 1536]
const THEMES = ['light', 'dark']
const DEMO_LIMIT = 60 * 1024

const results = []
const sleep = ms => new Promise(r => setTimeout(r, ms))

function check(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`)
}

function buildDocs() {
  execSync('pnpm --filter ranklint-docs build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NUXT_SITE_URL: BASE },
  })
}

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await fetch(`${BASE}/en`).then(res => res.ok).catch(() => false)
    if (ok) return
    await sleep(500)
  }
  throw new Error('docs server did not start')
}

function measure() {
  const visible = el => el.getClientRects().length > 0

  const lineHeight = (el) => {
    const style = getComputedStyle(el)
    const value = Number.parseFloat(style.lineHeight)
    return Number.isNaN(value) ? Number.parseFloat(style.fontSize) * 1.2 : value
  }

  const textLines = (el, gap) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const tops = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.textContent.trim()) continue
      const range = document.createRange()
      range.selectNodeContents(node)
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && rect.height > 0) tops.push(rect.top)
      }
    }
    return tops.sort((a, b) => a - b).filter((top, i, all) => i === 0 || top - all[i - 1] > gap).length
  }

  const wraps = (el) => {
    const height = lineHeight(el)
    if (el.getBoundingClientRect().height <= 1.6 * height) return false
    return textLines(el, height * 0.5) > 1
  }

  const label = (el) => {
    const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40)
    return `${el.tagName.toLowerCase()}"${text}"`
  }

  const doc = document.documentElement
  const dashes = [...(document.body.innerText.match(/[–—]/g) ?? [])]
  const eyebrows = [...document.querySelectorAll('[class*="uppercase"][class*="tracking-"]')].filter(visible)
  const buttons = [
    ...document.querySelectorAll('a.landing-cta, button, [role=button]'),
    ...document.querySelectorAll('header a'),
  ].filter(visible)
  const wrapped = buttons.filter(wraps).map(label)
  const header = document.querySelector('header')
  const h1 = document.querySelector('h1')
  const primary = document.querySelector('main a[href*="getting-started"]')
  const alternates = [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(el => el.getAttribute('hreflang'))

  return {
    scrollWidth: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    dashes: dashes.length,
    h1Count: document.querySelectorAll('h1').length,
    eyebrows: eyebrows.length,
    eyebrowLabels: eyebrows.slice(0, 5).map(label),
    wrapped,
    headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
    h1Bottom: h1 ? Math.round(h1.getBoundingClientRect().bottom) : null,
    primaryBottom: primary ? Math.round(primary.getBoundingClientRect().bottom) : null,
    ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
    twitterCard: Boolean(document.querySelector('meta[name="twitter:card"]')),
    canonical: Boolean(document.querySelector('link[rel=canonical]')),
    alternates,
  }
}

async function auditPage(browser, locale, width, theme) {
  const context = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await context.newPage()
  const errors = []
  const warnings = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
    if (msg.type() === 'warning' && msg.text().includes('[ranklint]')) warnings.push(msg.text())
  })
  try {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' })
    await sleep(400)
    const data = await page.evaluate(measure)
    const tag = `${locale} ${width} ${theme}`

    check(`${tag} no horizontal scroll`, data.scrollWidth === data.clientWidth, `scrollWidth ${data.scrollWidth}, clientWidth ${data.clientWidth}`)
    check(`${tag} no em/en dashes`, data.dashes === 0, `${data.dashes} found`)
    check(`${tag} exactly one h1`, data.h1Count === 1, `${data.h1Count} found`)
    check(`${tag} at most 3 eyebrows`, data.eyebrows <= 3, `${data.eyebrows} visible: ${data.eyebrowLabels.join(', ')}`)
    check(`${tag} buttons stay on one line`, data.wrapped.length === 0, data.wrapped.join(', ') || 'none wrapped')
    if (width >= 1024) {
      check(`${tag} header at most 80px`, data.headerHeight !== null && data.headerHeight <= 80, `${data.headerHeight}px`)
    }
    check(`${tag} no console errors`, errors.length === 0, errors.slice(0, 3).join(' | ') || 'none')
    check(`${tag} no [ranklint] warnings`, warnings.length === 0, warnings.slice(0, 3).join(' | ') || 'none')

    await page.screenshot({ path: join(shotsDir, `${locale}-${width}-${theme}.png`), fullPage: true })
    return data
  } finally {
    await context.close()
  }
}

async function auditFold(browser, locale, theme) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await context.newPage()
  try {
    await page.emulateMedia({ colorScheme: theme })
    await page.goto(`${BASE}/${locale}`, { waitUntil: 'networkidle' })
    await sleep(400)
    const data = await page.evaluate(measure)
    const tag = `${locale} fold 1280x720 ${theme}`
    check(`${tag} h1 above the fold`, data.h1Bottom !== null && data.h1Bottom <= 720, `h1 bottom ${data.h1Bottom}`)
    check(`${tag} primary cta above the fold`, data.primaryBottom !== null && data.primaryBottom <= 720, `cta bottom ${data.primaryBottom}`)
    await page.screenshot({ path: join(shotsDir, `${locale}-fold-1280-${theme}.png`) })
  } finally {
    await context.close()
  }
}

function auditHead(locale, data) {
  check(`${locale} head og:image`, data.ogImage.length > 0, data.ogImage || 'missing')
  check(`${locale} head twitter:card`, data.twitterCard, data.twitterCard ? 'present' : 'missing')
  check(`${locale} head canonical`, data.canonical, data.canonical ? 'present' : 'missing')
  const hreflangs = data.alternates.join(', ')
  check(
    `${locale} head hreflang en and ru`,
    data.alternates.includes('en') && data.alternates.includes('ru'),
    hreflangs || 'none',
  )
}

function auditDemoChunk() {
  const files = existsSync(nuxtDir)
    ? readdirSync(nuxtDir).filter(name => name.endsWith('.js') && readFileSync(join(nuxtDir, name), 'utf8').includes('meta:title-required'))
    : []
  if (files.length === 0) {
    check('demo chunk within 60 KB gzip', false, 'no chunk with level 1 rule ids found')
    return
  }
  const total = files.reduce((sum, name) => sum + gzipSync(readFileSync(join(nuxtDir, name))).length, 0)
  check('demo chunk within 60 KB gzip', total <= DEMO_LIMIT, `${total} bytes gzip in ${files.join(', ')} (limit ${DEMO_LIMIT})`)
}

if (!existsSync(entry) || process.argv.includes('--build')) buildDocs()
mkdirSync(shotsDir, { recursive: true })

const server = spawn('node', [entry], {
  cwd: root,
  stdio: 'ignore',
  detached: true,
  env: { ...process.env, PORT: String(PORT), NUXT_SITE_URL: BASE },
})

try {
  await waitForServer(60_000)
  const browser = await chromium.launch()
  try {
    for (const locale of LOCALES) {
      let head = null
      for (const width of WIDTHS) {
        for (const theme of THEMES) {
          head = await auditPage(browser, locale, width, theme)
        }
      }
      for (const theme of THEMES) await auditFold(browser, locale, theme)
      if (head) auditHead(locale, head)
    }
  } finally {
    await browser.close()
  }
} finally {
  if (server.pid) process.kill(-server.pid, 'SIGTERM')
}

auditDemoChunk()

const failed = results.filter(result => !result.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
if (failed.length > 0) {
  console.error(`LANDING GATE FAILED: ${failed.length} checks`)
  process.exit(1)
}

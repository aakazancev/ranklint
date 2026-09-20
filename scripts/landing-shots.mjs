import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(new URL('../packages/cli/package.json', import.meta.url))
const { chromium } = require('playwright')

const publicDir = join(root, 'docs/public')
const builtDir = join(root, 'docs/.output/public')
const MAX_BYTES = 300 * 1024

function report(file) {
  const bytes = statSync(file).size
  const kb = Math.round(bytes / 1024)
  console.log(`${file} - ${kb} KB${bytes > MAX_BYTES ? ' (over 300 KB limit!)' : ''}`)
  if (bytes > MAX_BYTES) throw new Error(`${file} is larger than 300 KB`)
}

async function iconShots(browser) {
  if (!existsSync(builtDir)) mkdirSync(builtDir, { recursive: true })
  const page = join(builtDir, 'ranklint-icons.html')
  writeFileSync(page, `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: 'Mark'; src: url('./fonts/jetbrains-og-700.ttf') format('truetype'); font-weight: 700; }
  body { margin: 0; display: flex; align-items: flex-start; gap: 24px; background: #ffffff; }
  .mark { display: grid; place-items: center; background: #0a0b0d; color: #b4f13c; font-family: 'Mark', monospace; font-weight: 700; letter-spacing: -0.05em; }
  #mark-32 { width: 32px; height: 32px; font-size: 18px; }
  #mark-180 { width: 180px; height: 180px; font-size: 100px; }
  #mark-512 { width: 512px; height: 512px; font-size: 284px; }
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

const browser = await chromium.launch()
try {
  await iconShots(browser)
} finally {
  await browser.close()
}

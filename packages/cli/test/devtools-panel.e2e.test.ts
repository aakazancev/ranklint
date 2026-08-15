import { spawn, type ChildProcess } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Frame, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../..', import.meta.url))
const clientBundle = `${root}packages/devtools/dist/client/main.mjs`
const PORT = 4179
const BASE = `http://localhost:${PORT}`

let server: ChildProcess
let browser: Browser
let page: Page

async function waitForServer(timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const ok = await fetch(`${BASE}/`).then(res => res.ok).catch(() => false)
    if (ok) return
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('playground dev server did not start')
}

async function frameWith(urlPart: string): Promise<Frame> {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const frame = page.frames().find(f => f.url().includes(urlPart))
    if (frame) return frame
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`frame "${urlPart}" did not appear`)
}

describe.skipIf(!existsSync(clientBundle))('devtools panel e2e', () => {
  beforeAll(async () => {
    const env = { ...process.env, NODE_ENV: 'development' }
    delete env.VITEST
    delete env.TEST
    delete env.NUXT_RANKLINT_ENV
    server = spawn('npx', ['nuxt', 'dev', '--port', String(PORT)], {
      cwd: `${root}playground`,
      stdio: 'ignore',
      detached: true,
      env,
    })
    await waitForServer(90_000)
    browser = await chromium.launch()
    page = await browser.newPage()
  }, 120_000)

  afterAll(async () => {
    await browser?.close()
    if (server?.pid) process.kill(-server.pid, 'SIGTERM')
  })

  it('serves the zones endpoint (null without ranklint.config)', async () => {
    const res = await fetch(`${BASE}/__ranklint/devtools-zones`)
    expect(res.ok).toBe(true)
    expect(await res.json()).toEqual({ apps: null })
  })

  it('renders the live report and updates on host navigation', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
    const toggle = 'nuxt-devtools-frame .nuxt-devtools-nuxt-button, nuxt-devtools-frame .nuxt-devtools-toggle'
    try {
      await page.waitForSelector(toggle, { state: 'attached', timeout: 60_000 })
    } catch (e) {
      const state = await page.evaluate(() => ({
        container: document.querySelector('#nuxt-devtools-container')?.outerHTML.slice(0, 200) ?? '(no container)',
        shadow: document.querySelector('nuxt-devtools-frame')?.shadowRoot?.innerHTML.length ?? 0,
      }))
      throw new Error(`devtools toggle missing; state: ${JSON.stringify(state)}`, { cause: e })
    }
    await page.locator(toggle).first().click({ force: true, timeout: 15_000 })
    const devtools = await frameWith('__nuxt_devtools__')
    await devtools.goto(`${BASE}/__nuxt_devtools__/client/modules/custom-ranklint`)
    const deadline = Date.now() + 45_000
    while (Date.now() < deadline) {
      if (page.frames().some(f => f.url().includes('/__ranklint/devtools'))) break
      const getStarted = devtools.locator('a:has-text("Get Started")')
      if (await getStarted.count() > 0) {
        await getStarted.first().click()
        await new Promise(r => setTimeout(r, 1500))
        await devtools.goto(`${BASE}/__nuxt_devtools__/client/modules/custom-ranklint`)
      }
      await new Promise(r => setTimeout(r, 500))
    }
    const panel = await frameWith('/__ranklint/devtools')
    await panel.waitForSelector('h2', { timeout: 30_000 })
    const initial = await panel.evaluate(() => document.body.innerText)
    expect(initial).toContain('Issues')
    expect(initial).toContain('Outline')

    await page.evaluate(() => {
      const link = [...document.querySelectorAll('a')]
        .find(a => a.getAttribute('href') === '/bugs/title-short')
      link?.click()
    })
    await panel.waitForFunction(
      () => document.body.innerText.includes('/bugs/title-short'),
      undefined,
      { timeout: 15_000 },
    )
    const after = await panel.evaluate(() => document.body.innerText)
    expect(after).toContain('meta:title-length')
  }, 120_000)
})

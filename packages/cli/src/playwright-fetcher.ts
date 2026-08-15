import type { FetchAuth, PageFetcher, PageSnapshot } from '@ranklint/core'
import { authHeaders, HttpFetcher } from '@ranklint/core'
import { chromium, type Browser } from 'playwright'

export interface PlaywrightFetcherOptions {
  auth?: FetchAuth
  viewport?: { width: number, height: number }
  insecureTls?: boolean
}

export class PlaywrightFetcher implements PageFetcher {
  private browser?: Browser
  private http: HttpFetcher
  private auth?: FetchAuth
  private viewport?: { width: number, height: number }
  private insecureTls?: boolean

  constructor(options: PlaywrightFetcherOptions = {}) {
    this.auth = options.auth
    this.viewport = options.viewport
    this.insecureTls = options.insecureTls
    this.http = new HttpFetcher(options.auth)
  }

  async fetch(url: string, opts?: { userAgent?: string }): Promise<PageSnapshot> {
    this.browser ??= await chromium.launch()
    const headers = authHeaders(this.auth)
    const context = await this.browser.newContext({
      ...(opts?.userAgent ? { userAgent: opts.userAgent } : {}),
      ...(Object.keys(headers).length > 0 ? { extraHTTPHeaders: headers } : {}),
      ...(this.viewport ? { viewport: this.viewport } : {}),
      ...(this.insecureTls ? { ignoreHTTPSErrors: true } : {}),
    })
    const page = await context.newPage()
    try {
      const start = performance.now()
      const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
      if (!response) throw new Error(`No response for ${url}`)
      const ttfb = Math.round(performance.now() - start)
      const ssrHtml = await response.text()
      const html = await page.content()
      const links = await page.$$eval('a[href]', anchors => anchors.map(a => ({
        href: a.getAttribute('href') ?? '',
        text: a.textContent?.trim() ?? '',
        rel: a.getAttribute('rel') ?? undefined,
      })))
      const aboveFoldImages = await page.$$eval('img', imgs => imgs
        .filter((img) => {
          const rect = img.getBoundingClientRect()
          return rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0
        })
        .map(img => img.getAttribute('src') ?? '')
        .filter(src => src !== ''))
      return {
        url,
        html,
        ssrHtml,
        statusCode: response.status(),
        headers: response.headers(),
        ttfb,
        links,
        aboveFoldImages,
      }
    } finally {
      await context.close()
    }
  }

  head(url: string) {
    return this.http.head(url)
  }

  async close() {
    await this.browser?.close()
    this.browser = undefined
    await this.http.close()
  }
}

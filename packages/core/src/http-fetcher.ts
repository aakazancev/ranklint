import { parseHTML } from 'linkedom'
import type { PageFetcher, PageLink, PageSnapshot } from './types'

export function parseLinks(html: string): PageLink[] {
  const { document } = parseHTML(html)
  return [...document.querySelectorAll('a[href]')].map(a => ({
    href: a.getAttribute('href') ?? '',
    text: a.textContent?.trim() ?? '',
    rel: a.getAttribute('rel') ?? undefined,
  }))
}

export class HttpFetcher implements PageFetcher {
  async fetch(url: string, opts?: { userAgent?: string }): Promise<PageSnapshot> {
    const start = performance.now()
    const res = await globalThis.fetch(url, {
      headers: opts?.userAgent ? { 'user-agent': opts.userAgent } : undefined,
    })
    const ttfb = Math.round(performance.now() - start)
    const html = await res.text()
    return {
      url,
      html,
      statusCode: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      ttfb,
      links: parseLinks(html),
    }
  }

  async head(url: string) {
    const res = await globalThis.fetch(url, { method: 'HEAD', redirect: 'manual' })
    return { statusCode: res.status, headers: Object.fromEntries(res.headers.entries()) }
  }

  async close() {}
}

import { parseHTML } from 'linkedom'
import type { FetchAuth, PageFetcher, PageLink, PageSnapshot } from './types'

export function parseLinks(html: string): PageLink[] {
  const { document } = parseHTML(html)
  return [...document.querySelectorAll('a[href]')].map(a => ({
    href: a.getAttribute('href') ?? '',
    text: a.textContent?.trim() ?? '',
    rel: a.getAttribute('rel') ?? undefined,
  }))
}

export function authHeaders(auth?: FetchAuth): Record<string, string> {
  const headers: Record<string, string> = { ...auth?.headers }
  if (auth?.basic) {
    headers.authorization = `Basic ${Buffer.from(`${auth.basic.username}:${auth.basic.password}`).toString('base64')}`
  }
  if (auth?.cookies?.length) {
    headers.cookie = auth.cookies.map(c => `${c.name}=${c.value}`).join('; ')
  }
  return headers
}

export class HttpFetcher implements PageFetcher {
  constructor(private auth?: FetchAuth) {}

  async fetch(url: string, opts?: { userAgent?: string }): Promise<PageSnapshot> {
    const start = performance.now()
    const res = await globalThis.fetch(url, {
      headers: {
        ...authHeaders(this.auth),
        ...(opts?.userAgent ? { 'user-agent': opts.userAgent } : {}),
      },
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
    const res = await globalThis.fetch(url, { method: 'HEAD', redirect: 'manual', headers: authHeaders(this.auth) })
    return { statusCode: res.status, headers: Object.fromEntries(res.headers.entries()) }
  }

  async close() {}
}

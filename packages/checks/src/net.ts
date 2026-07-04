import type { PageFetcher } from '@ranklint/core'

export interface ResolvedUrl {
  status: number
  hops: number
  firstStatus: number
}

const caches = new WeakMap<PageFetcher, Map<string, Promise<ResolvedUrl>>>()

async function follow(fetcher: PageFetcher, url: string, maxFollow: number): Promise<ResolvedUrl> {
  let current = url
  let hops = 0
  let firstStatus = 0
  while (true) {
    let statusCode: number
    let headers: Record<string, string>
    try {
      ({ statusCode, headers } = await fetcher.head(current))
    } catch {
      return { status: 0, hops, firstStatus: firstStatus || 0 }
    }
    if (hops === 0) firstStatus = statusCode
    const location = headers.location
    if (statusCode >= 300 && statusCode < 400 && location && hops < maxFollow) {
      const next = (() => {
        try {
          return new URL(location, current).toString()
        } catch {
          return null
        }
      })()
      if (!next) return { status: statusCode, hops, firstStatus }
      current = next
      hops++
      continue
    }
    return { status: statusCode, hops, firstStatus }
  }
}

export function resolveUrl(fetcher: PageFetcher, url: string, maxFollow = 5): Promise<ResolvedUrl> {
  let cache = caches.get(fetcher)
  if (!cache) {
    cache = new Map()
    caches.set(fetcher, cache)
  }
  let pending = cache.get(url)
  if (!pending) {
    pending = follow(fetcher, url, maxFollow)
    cache.set(url, pending)
  }
  return pending
}

import { describe, expect, it } from 'vitest'
import { resolveUrl } from '../src/net'
import { fakeHeadFetcher } from '../src/test-utils'

describe('resolveUrl', () => {
  it('returns final status and hop count through redirects', async () => {
    const fetcher = fakeHeadFetcher({
      'https://x.com/a': { status: 301, location: '/b' },
      'https://x.com/b': { status: 302, location: '/c' },
      'https://x.com/c': { status: 200 },
    })
    expect(await resolveUrl(fetcher, 'https://x.com/a')).toEqual({ status: 200, hops: 2 })
    expect(await resolveUrl(fetcher, 'https://x.com/c')).toEqual({ status: 200, hops: 0 })
  })

  it('caches per fetcher instance', async () => {
    let calls = 0
    const fetcher = {
      ...fakeHeadFetcher({}),
      head: async () => {
        calls++
        return { statusCode: 200, headers: {} }
      },
    }
    await resolveUrl(fetcher, 'https://x.com/a')
    await resolveUrl(fetcher, 'https://x.com/a')
    expect(calls).toBe(1)
  })

  it('reports status 0 on network failure', async () => {
    const fetcher = {
      ...fakeHeadFetcher({}),
      head: async () => {
        throw new Error('down')
      },
    }
    expect(await resolveUrl(fetcher, 'https://x.com/a')).toEqual({ status: 0, hops: 0 })
  })

  it('stops following after maxFollow hops', async () => {
    const fetcher = fakeHeadFetcher({
      'https://x.com/1': { status: 301, location: '/2' },
      'https://x.com/2': { status: 301, location: '/1' },
    })
    const result = await resolveUrl(fetcher, 'https://x.com/1', 3)
    expect(result.hops).toBe(3)
    expect(result.status).toBe(301)
  })
})

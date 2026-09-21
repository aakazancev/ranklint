import { beforeEach, describe, expect, it, vi } from 'vitest'

const launches: { closed: boolean }[] = []

vi.mock('playwright', () => {
  const makePage = () => ({
    goto: async () => ({
      status: () => 200,
      headers: () => ({}),
      text: async () => '<html><head><title>t</title></head><body></body></html>',
    }),
    waitForLoadState: async () => {},
    content: async () => '<html><head><title>t</title></head><body></body></html>',
    $$eval: async () => [],
  })
  return {
    chromium: {
      launch: async () => {
        const browser = {
          closed: false,
          newContext: async () => ({
            newPage: async () => makePage(),
            close: async () => {},
          }),
          close: async () => { browser.closed = true },
        }
        launches.push(browser)
        return browser
      },
    },
  }
})

const { PlaywrightFetcher } = await import('../src/playwright-fetcher')

beforeEach(() => {
  launches.length = 0
})

describe('PlaywrightFetcher browser lifecycle', () => {
  it('launches a single browser for concurrent fetches', async () => {
    const fetcher = new PlaywrightFetcher()
    await Promise.all([fetcher.fetch('http://x.test/a'), fetcher.fetch('http://x.test/b')])
    expect(launches).toHaveLength(1)
    await fetcher.close()
  })

  it('closes every browser it launched', async () => {
    const fetcher = new PlaywrightFetcher()
    await Promise.all([fetcher.fetch('http://x.test/a'), fetcher.fetch('http://x.test/b')])
    await fetcher.close()
    expect(launches.filter(b => !b.closed)).toEqual([])
  })
})

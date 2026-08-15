import { fileURLToPath } from 'node:url'
import type { PageFetcher } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { runAudit } from '../src/run-audit'

const cwd = fileURLToPath(new URL('./fixtures/custom-checks', import.meta.url))

function fetcherFor(html: string): PageFetcher {
  return {
    fetch: async url => ({ url, html, statusCode: 200, headers: {}, ttfb: 1, links: [] }),
    head: async () => ({ statusCode: 200, headers: {} }),
    close: async () => {},
  }
}

const loremPage = '<html><body><h1>Nice heading long enough for checks</h1><p>Lorem ipsum dolor sit amet.</p></body></html>'

describe('custom checks from ranklint.config', () => {
  it('runs user checks alongside built-ins with severity from rules', async () => {
    const report = await runAudit({
      url: 'https://custom.test/',
      cwd,
      fetcher: fetcherFor(loremPage),
    })
    const custom = report.issues.filter(i => i.checkId === 'myteam:no-lorem')
    expect(custom).toHaveLength(1)
    expect(custom[0]?.severity).toBe('error')
    expect(report.issues.some(i => i.checkId === 'meta:title-required')).toBe(true)
  })

  it('rejects custom check id clashing with a built-in', async () => {
    await expect(runAudit({
      url: 'https://custom.test/',
      fetcher: fetcherFor(loremPage),
      config: {
        site: { url: 'https://custom.test' },
        customChecks: [{
          id: 'meta:title-required',
          category: 'meta',
          severity: 'error',
          scope: 'page',
          run: async () => [],
        }],
      },
    })).rejects.toThrow('clashes with a built-in')
  })
})

import type { PageSnapshot } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { buildOutline } from '../src/outline'

function snap(path: string, body: string, statusCode = 200): PageSnapshot {
  return {
    url: `https://x.com${path}`,
    html: `<html><body>${body}</body></html>`,
    statusCode,
    headers: {},
    ttfb: 1,
    links: [],
  }
}

describe('buildOutline', () => {
  it('renders nested heading tree per page, skipping non-200', () => {
    const out = buildOutline([
      snap('/b', '<h1>Title B</h1><h2>Section</h2><h3>Sub</h3>'),
      snap('/a', '<h1>Title A</h1>'),
      snap('/missing', '<h1>404</h1>', 404),
      snap('/empty', ''),
    ])
    expect(out.indexOf('## /a')).toBeLessThan(out.indexOf('## /b'))
    expect(out).toContain('- **h1** Title B')
    expect(out).toContain('  - **h2** Section')
    expect(out).toContain('    - **h3** Sub')
    expect(out).toContain('_(no headings)_')
    expect(out).not.toContain('/missing')
  })
})

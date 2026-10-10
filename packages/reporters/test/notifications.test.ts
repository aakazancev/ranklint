import type { DiffResult, Issue } from '@ranklint/core'
import { describe, expect, it } from 'vitest'
import { slackPayload, telegramText } from '../src/notifications'

function issue(severity: Issue['severity'], path: string): Issue {
  return { checkId: `rule:${severity}`, severity, message: 'm', url: `https://x.com${path}` }
}

const diff: DiffResult = {
  newIssues: [
    ...Array.from({ length: 12 }, (_, i) => issue('info', `/i${i}`)),
    issue('warn', '/w'),
    issue('error', '/e1'),
    issue('error', '/e2'),
  ],
  fixedIssues: [],
  pagesDelta: { added: [], removed: [] },
}

const paths = (text: string) => [...text.matchAll(/https:\/\/x\.com(\/\w+)/g)].map(m => m[1])

describe('notifications', () => {
  it('telegramText lists errors first before the cut', () => {
    const out = telegramText(diff, 'https://x.com')
    expect(paths(out)).toEqual(['/e1', '/e2', '/w', ...Array.from({ length: 7 }, (_, i) => `/i${i}`)])
    expect(out).toContain('…and 5 more')
  })

  it('slackPayload lists errors first before the cut', () => {
    const payload = slackPayload(diff, 'https://x.com')
    const list = (payload.blocks[1] as { text: { text: string } }).text.text
    expect(paths(list)).toEqual(['/e1', '/e2', '/w', ...Array.from({ length: 7 }, (_, i) => `/i${i}`)])
  })
})

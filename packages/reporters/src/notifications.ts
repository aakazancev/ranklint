import type { DiffResult } from '@ranklint/core'

export function slackPayload(diff: DiffResult, siteUrl: string): { text: string, blocks: unknown[] } {
  const errors = diff.newIssues.filter(i => i.severity === 'error').length
  const headline = `Ranklint: ${diff.newIssues.length} new SEO issues (${errors} errors) on ${siteUrl}`
  const list = diff.newIssues.slice(0, 10)
    .map(i => `• *${i.checkId}* ${i.url}\n  ${i.message}`)
    .join('\n')
  return {
    text: headline,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*${headline}*` } },
      ...(list ? [{ type: 'section', text: { type: 'mrkdwn', text: list } }] : []),
      ...(diff.fixedIssues.length > 0
        ? [{ type: 'context', elements: [{ type: 'mrkdwn', text: `✅ ${diff.fixedIssues.length} issues fixed since last run` }] }]
        : []),
    ],
  }
}

export function telegramText(diff: DiffResult, siteUrl: string): string {
  const errors = diff.newIssues.filter(i => i.severity === 'error').length
  const lines = [`Ranklint: ${diff.newIssues.length} new SEO issues (${errors} errors) on ${siteUrl}`]
  for (const issue of diff.newIssues.slice(0, 10)) {
    lines.push(`- [${issue.severity}] ${issue.checkId} ${issue.url}: ${issue.message}`)
  }
  if (diff.newIssues.length > 10) lines.push(`…and ${diff.newIssues.length - 10} more`)
  if (diff.fixedIssues.length > 0) lines.push(`Fixed since last run: ${diff.fixedIssues.length}`)
  return lines.join('\n')
}

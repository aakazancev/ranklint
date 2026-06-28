import type { DiffResult, Issue, Report } from './types'

export function issueKey(issue: Issue): string {
  let path: string
  try {
    const u = new URL(issue.url)
    path = u.pathname + u.search
  } catch {
    path = issue.url
  }
  return `${issue.checkId}|${path}|${issue.selector ?? ''}`
}

export function diffReports(base: Report, current: Report): DiffResult {
  if (base.formatVersion !== current.formatVersion) {
    throw new Error(
      `Cannot diff reports with different formats: base v${base.formatVersion}, current v${current.formatVersion}. Re-run the audit on both sides with the same ranklint version.`,
    )
  }
  const baseKeys = new Set(base.issues.map(issueKey))
  const currentKeys = new Set(current.issues.map(issueKey))
  const basePages = new Set(base.pages ?? [])
  const currentPages = new Set(current.pages ?? [])
  return {
    newIssues: current.issues.filter(issue => !baseKeys.has(issueKey(issue))),
    fixedIssues: base.issues.filter(issue => !currentKeys.has(issueKey(issue))),
    pagesDelta: {
      added: [...currentPages].filter(p => !basePages.has(p)).sort(),
      removed: [...basePages].filter(p => !currentPages.has(p)).sort(),
    },
  }
}

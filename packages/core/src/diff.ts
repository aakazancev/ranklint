import type { DiffResult, Issue, LighthouseMetrics, Report } from './types'

function lighthouseDeltas(base: Report, current: Report): DiffResult['lighthouse'] {
  if (!base.lighthouse || !current.lighthouse) return undefined
  const byPath = new Map(base.lighthouse.map(r => [pathKey(r.url), r]))
  const deltas: NonNullable<DiffResult['lighthouse']> = []
  for (const result of current.lighthouse) {
    const baseResult = byPath.get(pathKey(result.url))
    if (!baseResult) continue
    for (const metric of Object.keys(result.metrics) as (keyof LighthouseMetrics)[]) {
      const currentValue = result.metrics[metric]
      const baseValue = baseResult.metrics[metric]
      if (currentValue === undefined || baseValue === undefined) continue
      if (Math.round(currentValue * 1000) === Math.round(baseValue * 1000)) continue
      deltas.push({ url: result.url, metric, base: baseValue, current: currentValue })
    }
  }
  return deltas
}

function pathKey(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

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
    lighthouse: lighthouseDeltas(base, current),
    pagesDelta: {
      added: [...currentPages].filter(p => !basePages.has(p)).sort(),
      removed: [...basePages].filter(p => !currentPages.has(p)).sort(),
    },
  }
}

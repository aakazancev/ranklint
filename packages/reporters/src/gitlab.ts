import type { Report, Severity } from '@ranklint/core'

const SEVERITY_MAP: Record<Severity, string> = {
  error: 'major',
  warn: 'minor',
  info: 'info',
}

function fingerprint(value: string): string {
  let hash = 5381
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function gitlab(report: Report): string {
  const entries = report.issues.map((issue) => {
    let path: string
    try {
      path = new URL(issue.url).pathname
    } catch {
      path = issue.url
    }
    return {
      description: `${issue.checkId}: ${issue.message}`,
      check_name: issue.checkId,
      fingerprint: fingerprint(`${issue.checkId}|${path}|${issue.selector ?? ''}`),
      severity: SEVERITY_MAP[issue.severity],
      location: {
        path: path.replace(/^\//, '') || 'index',
        lines: { begin: 1 },
      },
    }
  })
  return JSON.stringify(entries, null, 2)
}

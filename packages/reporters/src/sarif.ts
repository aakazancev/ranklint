import { createHash } from 'node:crypto'
import type { Issue, Report, Severity } from '@ranklint/core'
import { issueKey } from '@ranklint/core'

const LEVEL_MAP: Record<Severity, string> = {
  error: 'error',
  warn: 'warning',
  info: 'note',
}

interface SarifRule {
  id: string
  shortDescription: { text: string }
  helpUri?: string
}

function rulesOf(issues: Issue[]): SarifRule[] {
  const rules = new Map<string, SarifRule>()
  for (const issue of issues) {
    const known = rules.get(issue.checkId)
    if (known) {
      if (!known.helpUri && issue.docs) known.helpUri = issue.docs
      continue
    }
    rules.set(issue.checkId, {
      id: issue.checkId,
      shortDescription: { text: issue.checkId },
      ...(issue.docs ? { helpUri: issue.docs } : {}),
    })
  }
  return [...rules.values()]
}

function fingerprint(issue: Issue): string {
  return createHash('sha256').update(issueKey(issue)).digest('hex').slice(0, 32)
}

export function sarif(report: Report): string {
  const doc = {
    version: '2.1.0',
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    runs: [
      {
        tool: {
          driver: {
            name: 'ranklint',
            informationUri: 'https://ranklint.dev',
            rules: rulesOf(report.issues),
          },
        },
        results: report.issues.map(issue => ({
          ruleId: issue.checkId,
          level: LEVEL_MAP[issue.severity],
          message: { text: issue.suggestion ? `${issue.message} ${issue.suggestion}` : issue.message },
          locations: [
            { physicalLocation: { artifactLocation: { uri: issue.url } } },
          ],
          partialFingerprints: { primaryLocationLineHash: fingerprint(issue) },
          ...(issue.selector ? { properties: { selector: issue.selector } } : {}),
        })),
      },
    ],
  }
  return `${JSON.stringify(doc, null, 2)}\n`
}

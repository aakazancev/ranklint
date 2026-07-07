import type { Severity } from '@ranklint/core'
import { allChecks } from '@ranklint/checks'

export const rules: Record<string, Severity> = Object.fromEntries(
  allChecks.map(check => [check.id, check.severity]),
)

export default { rules }

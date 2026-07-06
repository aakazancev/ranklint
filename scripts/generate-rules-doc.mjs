import { writeFileSync } from 'node:fs'
import { allChecks } from '../packages/checks/dist/index.mjs'

const lines = [
  '# Ranklint rules reference',
  '',
  `Generated from the check registry — ${allChecks.length} rules. Every rule accepts \`'error' | 'warn' | 'off'\` or \`[severity, options]\` in \`seo.config.ts\`, and can be suppressed per page with \`useRanklintIgnore()\`.`,
  '',
  '| Rule | Category | Scope | Default | Docs |',
  '| --- | --- | --- | --- | --- |',
]

for (const check of [...allChecks].sort((a, b) => a.id.localeCompare(b.id))) {
  lines.push(`| \`${check.id}\` | ${check.category} | ${check.scope} | ${check.severity} | [→](${check.docs}) |`)
}
lines.push('')
lines.push('Special rules outside the registry: `links:reachable` (foreign-zone reachability, configurable), `lighthouse:threshold` (from lighthouse config), `crawl:timeout`, `internal:check-failed`.')
lines.push('')

writeFileSync(new URL('../docs/rules.md', import.meta.url), lines.join('\n'))
console.log(`docs/rules.md: ${allChecks.length} rules`)

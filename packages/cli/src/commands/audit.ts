import { writeFile } from 'node:fs/promises'
import { defineCommand } from 'citty'
import { reporters, type ReporterName } from '@ranklint/reporters'
import { exitCodeFor } from '../exit-code'
import { runAudit } from '../run-audit'
import { startServer } from '../start-server'

export const audit = defineCommand({
  meta: {
    name: 'audit',
    description: 'Crawl a site and run SEO checks (exit 1 when errors are found; warn thresholds arrive in v0.2)',
  },
  args: {
    url: { type: 'string', description: 'URL of a running site to audit' },
    start: { type: 'string', description: 'Path to a built server entry (.output/server/index.mjs) to launch and audit' },
    profile: { type: 'string', description: 'Profile from ranklint.config to apply' },
    reporter: { type: 'string', default: 'markdown', description: 'Output format: markdown | json | junit' },
    output: { type: 'string', description: 'Write the report to a file instead of stdout' },
    jsonOutput: { type: 'string', description: 'Additionally write the raw json report to a file (input for ranklint diff)' },
    cwd: { type: 'string', description: 'Directory to look up ranklint.config in' },
    mode: { type: 'string', description: 'Set to "monitor" for scheduled prod runs: exit 0, diff against last stored report, alert on new issues only' },
  },
  async run({ args }) {
    if (!args.url && !args.start) {
      throw new Error('Provide --url <url> or --start <server entry>')
    }
    const reporterName = args.reporter as ReporterName
    const reporter = reporters[reporterName]
    if (!reporter) {
      throw new Error(`Unknown reporter "${args.reporter}". Available: ${Object.keys(reporters).join(', ')}`)
    }
    let server: Awaited<ReturnType<typeof startServer>> | undefined
    try {
      if (args.start) server = await startServer(args.start)
      const url = server?.url ?? args.url!
      if (args.mode === 'monitor') {
        const { runMonitor } = await import('../run-monitor')
        const { markdownDiff } = await import('@ranklint/reporters')
        const result = await runMonitor({ url, cwd: args.cwd, profile: args.profile })
        const output = result.diff ? markdownDiff(result.diff) : reporter(result.report)
        if (args.output) await writeFile(args.output, output)
        else process.stdout.write(output)
        if (result.notified.length > 0) process.stdout.write(`\nnotified: ${result.notified.join(', ')}\n`)
        process.exitCode = 0
        return
      }
      const report = await runAudit({
        url,
        cwd: args.cwd,
        profile: args.profile,
      })
      const output = reporter(report)
      if (args.jsonOutput) await writeFile(args.jsonOutput, reporters.json(report))
      if (args.output) await writeFile(args.output, output)
      else process.stdout.write(output)
      process.exitCode = exitCodeFor(report)
    } finally {
      await server?.stop()
    }
  },
})

import { writeFile } from 'node:fs/promises'
import { defineCommand } from 'citty'
import { json, markdown, markdownDiff } from '@ranklint/reporters'
import { diffExitCode, runDiff } from '../run-diff'

export const diff = defineCommand({
  meta: {
    name: 'diff',
    description: 'Compare a current report against a base (file path or GitLab ref)',
  },
  args: {
    base: { type: 'string', required: true, description: 'Base report: path to report.json or a git ref resolved via GitLab artifacts' },
    current: { type: 'string', required: true, description: 'Path to the current report.json (produced by audit --reporter json)' },
    reporter: { type: 'string', default: 'markdown', description: 'Output format: markdown | json' },
    output: { type: 'string', description: 'Write the diff to a file instead of stdout' },
  },
  async run({ args }) {
    const result = await runDiff({ base: args.base, currentFile: args.current })
    let output: string
    if (result.firstRun) {
      output = args.reporter === 'json'
        ? json(result.current)
        : `> First run — base report "${args.base}" not found, showing the full current report.\n\n${markdown(result.current)}`
    } else {
      output = args.reporter === 'json'
        ? JSON.stringify(result.diff, null, 2)
        : markdownDiff(result.diff!)
    }
    if (args.output) await writeFile(args.output, output)
    else process.stdout.write(output)
    process.exitCode = diffExitCode(result)
  },
})

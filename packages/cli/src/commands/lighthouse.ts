import { writeFile } from 'node:fs/promises'
import { defineCommand } from 'citty'
import type { RanklintUserConfig } from '@ranklint/core'
import { loadRanklintConfig } from '@ranklint/core'
import { checkThresholds, collectLighthouse } from '../lighthouse'
import { realLighthouseRunner } from '../real-lighthouse'

export const lighthouse = defineCommand({
  meta: {
    name: 'lighthouse',
    description: 'Run Lighthouse against a URL with aggregation and per-route thresholds from ranklint.config',
  },
  args: {
    url: { type: 'string', required: true, description: 'URL to measure' },
    runs: { type: 'string', description: 'Number of runs (default 5 or ranklint.config value)' },
    cwd: { type: 'string', description: 'Directory to look up ranklint.config in' },
    output: { type: 'string', description: 'Write the json result to a file instead of stdout' },
  },
  async run({ args }) {
    let config: RanklintUserConfig
    try {
      config = await loadRanklintConfig({ cwd: args.cwd })
    } catch {
      config = { site: { url: new URL(args.url).origin } }
    }
    const lhConfig = { ...config.lighthouse, ...(args.runs ? { runs: Number(args.runs) } : {}) }
    const results = await collectLighthouse([args.url], lhConfig, realLighthouseRunner)
    const issues = checkThresholds(results, lhConfig.thresholds)
    const output = JSON.stringify({ results, issues }, null, 2)
    if (args.output) await writeFile(args.output, output)
    else process.stdout.write(output)
    process.exitCode = issues.length > 0 ? 1 : 0
  },
})

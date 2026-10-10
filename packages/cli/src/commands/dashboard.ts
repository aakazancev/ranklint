import { defineCommand } from 'citty'
import { loadRanklintConfig, type RanklintUserConfig } from '@ranklint/core'
import { writeDashboard } from '../dashboard'

export const dashboard = defineCommand({
  meta: {
    name: 'dashboard',
    description: 'Build a static HTML dashboard with trends and per-run reports from stored monitor reports',
  },
  args: {
    'cwd': { type: 'string', description: 'Directory to look up ranklint.config in' },
    'dir': { type: 'string', description: 'Reports directory (default: monitor.dir from ranklint.config)' },
    'limit': { type: 'string', description: 'Use at most N latest reports (default: all)' },
    'out': { type: 'string', default: 'ranklint-dashboard', description: 'Output directory' },
    'run-url': { type: 'string', description: 'URL for the "Run audit" button, e.g. a CI pipeline page' },
    'logo': { type: 'string', description: 'Your logo: a local .png/.svg/.jpg/.webp file up to 200 KB (embedded) or an http(s) URL' },
    'brand-name': { type: 'string', description: 'Name shown next to the logo and used as its alt text' },
    'accent': { type: 'string', description: 'Accent color as #rgb or #rrggbb instead of the ranklint green' },
  },
  async run({ args }) {
    let limit: number | undefined
    if (args.limit !== undefined) {
      limit = Number.parseInt(args.limit, 10)
      if (!/^\d+$/.test(args.limit) || limit <= 0) {
        throw new Error(`--limit must be a positive integer, got "${args.limit}"`)
      }
    }
    let config: RanklintUserConfig | undefined
    try {
      config = await loadRanklintConfig({ cwd: args.cwd })
    } catch {
      config = undefined
    }
    const index = await writeDashboard({
      dir: args.dir ?? config?.monitor?.dir ?? '.ranklint/reports',
      out: args.out,
      limit,
      runUrl: args['run-url'],
      logo: args.logo,
      brandName: args['brand-name'],
      accent: args.accent,
    })
    process.stdout.write(`${index}\n`)
  },
})

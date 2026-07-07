import { defineCommand } from 'citty'
import { FsReportStorage, loadRanklintConfig, type RanklintUserConfig } from '@ranklint/core'
import { formatHistory, historyRow, type HistoryRow } from '../history'

export const history = defineCommand({
  meta: {
    name: 'history',
    description: 'Show the trend of stored monitor reports (fs storage)',
  },
  args: {
    cwd: { type: 'string', description: 'Directory to look up seo.config in' },
    dir: { type: 'string', description: 'Reports directory (default: monitor.dir from seo.config)' },
    limit: { type: 'string', default: '20', description: 'Show at most N latest reports' },
    csv: { type: 'boolean', default: false, description: 'Output CSV instead of a table' },
  },
  async run({ args }) {
    let config: RanklintUserConfig | undefined
    try {
      config = await loadRanklintConfig({ cwd: args.cwd })
    } catch {
      config = undefined
    }
    const dir = args.dir ?? config?.monitor?.dir ?? '.ranklint/reports'
    const storage = new FsReportStorage(dir)
    const entries = (await storage.list()).slice(-Number(args.limit))
    const rows: HistoryRow[] = []
    for (const entry of entries) {
      const report = await storage.load(entry.key)
      if (report) rows.push(historyRow(entry.key, report))
    }
    process.stdout.write(formatHistory(rows, args.csv))
  },
})

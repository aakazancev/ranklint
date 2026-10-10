import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { FsReportStorage } from '@ranklint/core'
import { dashboard, type DashboardEntry, html } from '@ranklint/reporters'

export interface WriteDashboardOptions {
  dir: string
  out: string
  limit?: number
  runUrl?: string
}

export async function writeDashboard(options: WriteDashboardOptions): Promise<string> {
  const storage = new FsReportStorage(options.dir)
  const all: DashboardEntry[] = []
  for (const { key } of await storage.list()) {
    const report = await storage.load(key)
    if (report) all.push({ key, report })
  }
  all.sort((a, b) => a.report.meta.timestamp.localeCompare(b.report.meta.timestamp))
  const entries = options.limit ? all.slice(-options.limit) : all
  await rm(join(options.out, 'runs'), { recursive: true, force: true })
  await mkdir(join(options.out, 'runs'), { recursive: true })
  for (const entry of entries) {
    await writeFile(join(options.out, 'runs', `${entry.key}.html`), html(entry.report))
  }
  const index = join(options.out, 'index.html')
  await writeFile(index, dashboard(entries, { runUrl: options.runUrl }))
  return index
}

import type { DiffResult, RanklintUserConfig, Report, ReportStorage } from '@ranklint/core'
import { diffReports, FsReportStorage, loadRanklintConfig } from '@ranklint/core'
import { fetchCruxField } from './crux'
import { notify, notifyEnvFromProcess, type NotifyEnv } from './notify'
import { runAudit, type RunAuditOptions } from './run-audit'
import { S3ReportStorage } from './s3-storage'

export interface RunMonitorOptions extends RunAuditOptions {
  storage?: ReportStorage
  notifyEnv?: NotifyEnv
  cruxApiKey?: string
  cruxApiUrl?: string
}

export interface MonitorResult {
  report: Report
  diff: DiffResult | null
  notified: string[]
}

export function storageFromConfig(config: RanklintUserConfig): ReportStorage {
  if (config.monitor?.storage === 's3') {
    if (!config.monitor.bucket) throw new Error('monitor.storage "s3" requires monitor.bucket')
    return new S3ReportStorage({
      bucket: config.monitor.bucket,
      prefix: config.monitor.prefix,
      endpoint: config.monitor.endpoint,
      region: config.monitor.region,
    })
  }
  return new FsReportStorage(config.monitor?.dir ?? '.ranklint/reports')
}

export async function runMonitor(opts: RunMonitorOptions): Promise<MonitorResult> {
  let config = opts.config
  if (!config) {
    try {
      config = await loadRanklintConfig({ cwd: opts.cwd, profile: opts.profile })
    } catch {
      config = { site: { url: new URL(opts.url).origin } }
    }
  }
  const storage = opts.storage ?? storageFromConfig(config)
  const report = await runAudit({ ...opts, config })

  const cruxKey = opts.cruxApiKey ?? process.env.RANKLINT_CRUX_API_KEY
  if (cruxKey) {
    try {
      report.crux = await fetchCruxField(new URL(config.site.url).origin, cruxKey, opts.cruxApiUrl) ?? undefined
    } catch (e) {
      console.warn(`[ranklint] CrUX fetch failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const base = await storage.latest()
  const diff = base ? diffReports(base, report) : null
  await storage.save(report, report.meta.timestamp)

  let notified: string[] = []
  if (diff && diff.newIssues.length > 0) {
    notified = await notify(diff, config.site.url, opts.notifyEnv ?? notifyEnvFromProcess())
  }
  return { report, diff, notified }
}

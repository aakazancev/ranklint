import type { DiffResult, RanklintUserConfig, Report, ReportStorage } from '@ranklint/core'
import type { ServiceAccountKey } from './gsc'
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
  gscToken?: string
  gscKeyFile?: string
  gscTokenUrl?: string
  gscProperty?: string
  gscApiUrl?: string
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
  return new FsReportStorage(config.monitor?.dir ?? '.ranklint/reports', config.monitor?.keep)
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

  let gscToken = opts.gscToken ?? process.env.RANKLINT_GSC_TOKEN
  const gscKeyFile = opts.gscKeyFile ?? process.env.RANKLINT_GSC_KEY_FILE
  if (!gscToken && gscKeyFile) {
    try {
      const [{ serviceAccountToken }, { readFile }] = await Promise.all([
        import('./gsc'),
        import('node:fs/promises'),
      ])
      const key = JSON.parse(await readFile(gscKeyFile, 'utf8')) as ServiceAccountKey
      gscToken = await serviceAccountToken(key, opts.gscTokenUrl)
    } catch (e) {
      console.warn(`[ranklint] GSC service account auth failed: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  if (gscToken) {
    try {
      const { inspectUrls } = await import('./gsc')
      const property = opts.gscProperty ?? process.env.RANKLINT_GSC_PROPERTY ?? config.site.url
      const urls = (report.pages ?? []).slice(0, 10).map(path => new URL(path, config.site.url).toString())
      report.searchConsole = await inspectUrls(property, urls, gscToken, opts.gscApiUrl)
    } catch (e) {
      console.warn(`[ranklint] Search Console inspection failed: ${e instanceof Error ? e.message : String(e)}`)
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

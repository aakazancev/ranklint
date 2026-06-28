import { readFile } from 'node:fs/promises'
import type { DiffResult, Report } from '@ranklint/core'
import { diffReports } from '@ranklint/core'
import { GitlabArtifactsStorage } from './gitlab-storage'

export interface RunDiffOptions {
  base: string
  currentFile: string
  loadBase?: (ref: string) => Promise<Report | null>
}

export interface RunDiffResult {
  diff: DiffResult | null
  current: Report
  firstRun: boolean
}

async function readReport(file: string): Promise<Report> {
  const report = JSON.parse(await readFile(file, 'utf8')) as Report
  if (typeof report.formatVersion !== 'number') {
    throw new Error(`"${file}" is not a ranklint report (missing formatVersion)`)
  }
  return report
}

export async function runDiff(opts: RunDiffOptions): Promise<RunDiffResult> {
  const current = await readReport(opts.currentFile)
  let base: Report | null
  try {
    base = await readReport(opts.base)
  } catch {
    const loadBase = opts.loadBase ?? (ref => new GitlabArtifactsStorage().load(ref))
    base = await loadBase(opts.base)
  }
  if (!base) {
    return { diff: null, current, firstRun: true }
  }
  return { diff: diffReports(base, current), current, firstRun: false }
}

export function diffExitCode(result: RunDiffResult): 0 | 1 {
  const issues = result.firstRun ? result.current.issues : result.diff!.newIssues
  return issues.some(i => i.severity === 'error') ? 1 : 0
}

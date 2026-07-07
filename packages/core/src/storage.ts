import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Report } from './types'

export interface ReportStorage {
  save(report: Report, key: string): Promise<void>
  load(key: string): Promise<Report | null>
  latest(): Promise<Report | null>
}

function sanitizeKey(key: string): string {
  return key.replace(/[^a-z0-9_.-]/gi, '_')
}

export class FsReportStorage implements ReportStorage {
  constructor(private dir: string, private keep?: number) {}

  private file(key: string): string {
    return join(this.dir, `${sanitizeKey(key)}.json`)
  }

  async save(report: Report, key: string): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    await writeFile(this.file(key), JSON.stringify(report))
    if (this.keep && this.keep > 0) await this.prune(this.keep)
  }

  async list(): Promise<{ key: string, mtime: number }[]> {
    let names: string[]
    try {
      names = (await readdir(this.dir)).filter(n => n.endsWith('.json'))
    } catch {
      return []
    }
    const entries = await Promise.all(names.map(async name => ({
      key: name.replace(/\.json$/, ''),
      mtime: (await stat(join(this.dir, name))).mtimeMs,
    })))
    return entries.sort((a, b) => a.mtime - b.mtime)
  }

  private async prune(keep: number): Promise<void> {
    const entries = await this.list()
    for (const entry of entries.slice(0, Math.max(0, entries.length - keep))) {
      await rm(join(this.dir, `${entry.key}.json`), { force: true })
    }
  }

  async load(key: string): Promise<Report | null> {
    try {
      return JSON.parse(await readFile(this.file(key), 'utf8')) as Report
    } catch {
      return null
    }
  }

  async latest(): Promise<Report | null> {
    let names: string[]
    try {
      names = (await readdir(this.dir)).filter(n => n.endsWith('.json'))
    } catch {
      return null
    }
    let best: { name: string, mtime: number } | undefined
    for (const name of names) {
      const { mtimeMs } = await stat(join(this.dir, name))
      if (!best || mtimeMs > best.mtime) best = { name, mtime: mtimeMs }
    }
    if (!best) return null
    try {
      return JSON.parse(await readFile(join(this.dir, best.name), 'utf8')) as Report
    } catch {
      return null
    }
  }
}

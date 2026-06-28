import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
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
  constructor(private dir: string) {}

  private file(key: string): string {
    return join(this.dir, `${sanitizeKey(key)}.json`)
  }

  async save(report: Report, key: string): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    await writeFile(this.file(key), JSON.stringify(report))
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

import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { FsReportStorage } from '@ranklint/core'
import { type Brand, dashboard, type DashboardEntry, html } from '@ranklint/reporters'

export interface WriteDashboardOptions {
  dir: string
  out: string
  limit?: number
  runUrl?: string
  logo?: string
  brandName?: string
  accent?: string
}

const LOGO_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
}
const LOGO_MAX_BYTES = 200 * 1024

async function loadLogo(logo: string): Promise<string> {
  if (/^https?:\/\//i.test(logo)) return logo
  const type = LOGO_TYPES[extname(logo).toLowerCase()]
  if (!type) throw new Error(`--logo must be a .png, .svg, .jpg, .jpeg or .webp file or an http(s) URL, got "${logo}"`)
  const info = await stat(logo).catch(() => undefined)
  if (!info?.isFile()) throw new Error(`--logo file not found: ${logo}`)
  if (info.size > LOGO_MAX_BYTES) throw new Error(`--logo file is larger than 200 KB (${Math.ceil(info.size / 1024)} KB): ${logo}`)
  return `data:${type};base64,${(await readFile(logo)).toString('base64')}`
}

async function resolveBrand(options: WriteDashboardOptions): Promise<Brand | undefined> {
  if (options.accent !== undefined && !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(options.accent)) {
    throw new Error(`--accent must be a hex color like #1e6bff, got "${options.accent}"`)
  }
  if (!options.logo && !options.brandName && !options.accent) return undefined
  return {
    logo: options.logo ? await loadLogo(options.logo) : undefined,
    name: options.brandName,
    accent: options.accent,
  }
}

export async function writeDashboard(options: WriteDashboardOptions): Promise<string> {
  const brand = await resolveBrand(options)
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
  const offset = all.length - entries.length
  for (const [index, entry] of entries.entries()) {
    const previous = all[offset + index - 1]?.report
    await writeFile(join(options.out, 'runs', `${entry.key}.html`), html(entry.report, { previous, dashboardHref: '../index.html', brand }))
  }
  const index = join(options.out, 'index.html')
  await writeFile(index, dashboard(entries, { runUrl: options.runUrl, brand }))
  return index
}

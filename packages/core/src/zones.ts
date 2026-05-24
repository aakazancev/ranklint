import type { AppZone } from './types'
import { matchPattern, mostSpecific, patternSpecificity } from './route-pattern'

export type UrlAction =
  | { action: 'crawl' | 'reachability', zone: string }
  | { action: 'skip' | 'external' }

export interface ZoneConfig {
  siteUrl: string
  apps?: Record<string, AppZone>
  ignore?: string[]
}

export function classifyUrl(url: string, cfg: ZoneConfig): UrlAction {
  let target: URL
  try {
    target = new URL(url, cfg.siteUrl)
  } catch {
    return { action: 'skip' }
  }
  if (target.origin !== new URL(cfg.siteUrl).origin) return { action: 'external' }
  const path = target.pathname
  if (cfg.ignore?.some(p => matchPattern(p, path))) return { action: 'skip' }
  const apps = cfg.apps ?? { self: { paths: ['/**'] } }
  let best: { zone: string, spec: number } | undefined
  for (const [zone, def] of Object.entries(apps)) {
    const m = mostSpecific(def.paths, path)
    if (m === undefined) continue
    const spec = patternSpecificity(m)
    if (!best || spec > best.spec) best = { zone, spec }
  }
  if (!best) return { action: 'skip' }
  if (best.zone === 'self') return { action: 'crawl', zone: 'self' }
  return { action: 'reachability', zone: best.zone }
}

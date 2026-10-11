import type { Issue, LighthouseAggregation, LighthouseMetrics, LighthouseResult } from '@ranklint/core'
import { mostSpecific } from '@ranklint/core'

export interface LighthouseRunRaw {
  metrics: LighthouseMetrics
  lcpSnippet?: string
}

export type LighthouseRunner = (url: string, opts: { formFactor: 'mobile' | 'desktop' }) => Promise<LighthouseRunRaw>

export interface LighthouseRunEvent {
  url: string
  page: number
  pages: number
  run: number
  runs: number
  ms: number
  metrics: LighthouseMetrics
}

export interface LighthouseConfig {
  runs?: number
  aggregation?: LighthouseAggregation
  formFactor?: 'mobile' | 'desktop'
  maxUrls?: number
  urls?: string[]
  thresholds?: Record<string, Record<string, number>>
}

const SCORE_METRICS = new Set<keyof LighthouseMetrics>(['performance', 'seo', 'accessibility', 'bestPractices'])

export function aggregate(values: number[], mode: LighthouseAggregation, metric: keyof LighthouseMetrics): number {
  const sorted = [...values].sort((a, b) => a - b)
  if (mode === 'best') {
    return SCORE_METRICS.has(metric) ? sorted[sorted.length - 1]! : sorted[0]!
  }
  const position = mode === 'median' ? 0.5 : 0.75
  const index = Math.min(sorted.length - 1, Math.round((sorted.length - 1) * position))
  return sorted[index]!
}

function lcpElement(snippet: string | undefined): LighthouseResult['lcpElement'] {
  if (!snippet) return undefined
  const isImage = snippet.includes('<img') || snippet.includes('background-image')
  return {
    type: isImage ? 'image' : 'text',
    snippet,
    suggestion: isImage
      ? 'Preload the LCP image and mark it with fetchpriority="high", never loading="lazy"'
      : undefined,
  }
}

export function lighthouseTargets(base: string, config: LighthouseConfig | undefined, discovered: string[]): string[] {
  if (config?.urls?.length) {
    const urls = config.urls.map(u => new URL(u, base).href)
    return config.maxUrls ? urls.slice(0, config.maxUrls) : urls
  }
  return discovered.slice(0, config?.maxUrls ?? 5)
}

export async function collectLighthouse(
  urls: string[],
  config: LighthouseConfig,
  runner: LighthouseRunner,
  onRun?: (event: LighthouseRunEvent) => void,
): Promise<LighthouseResult[]> {
  const runs = config.runs ?? 5
  const aggregation = config.aggregation ?? 'median'
  const formFactor = config.formFactor ?? 'mobile'
  const results: LighthouseResult[] = []
  const targets = urls.slice(0, config.maxUrls ?? urls.length)
  for (const [index, url] of targets.entries()) {
    const raws: LighthouseRunRaw[] = []
    for (let i = 0; i < runs; i++) {
      const started = Date.now()
      const raw = await runner(url, { formFactor })
      raws.push(raw)
      onRun?.({ url, page: index + 1, pages: targets.length, run: i + 1, runs, ms: Date.now() - started, metrics: raw.metrics })
    }
    const metrics: LighthouseMetrics = {}
    const keys = new Set(raws.flatMap(r => Object.keys(r.metrics))) as Set<keyof LighthouseMetrics>
    for (const key of keys) {
      const values = raws.map(r => r.metrics[key]).filter((v): v is number => v !== undefined)
      if (values.length > 0) metrics[key] = aggregate(values, aggregation, key)
    }
    results.push({
      url,
      runs,
      aggregation,
      metrics,
      lcpElement: lcpElement(raws.find(r => r.lcpSnippet)?.lcpSnippet),
    })
  }
  return results
}

export function checkThresholds(
  results: LighthouseResult[],
  thresholds: Record<string, Record<string, number>> | undefined,
): Issue[] {
  if (!thresholds) return []
  const patterns = Object.keys(thresholds)
  const issues: Issue[] = []
  for (const result of results) {
    let path: string
    try {
      path = new URL(result.url).pathname
    } catch {
      path = result.url
    }
    const pattern = mostSpecific(patterns, path)
    if (!pattern) continue
    for (const [metric, limit] of Object.entries(thresholds[pattern]!)) {
      const value = result.metrics[metric as keyof LighthouseMetrics]
      if (value === undefined) continue
      const isScore = SCORE_METRICS.has(metric as keyof LighthouseMetrics)
      const failed = isScore ? value < limit : value > limit
      if (!failed) continue
      issues.push({
        checkId: 'lighthouse:threshold',
        severity: 'error',
        message: `${metric} is ${value} on ${path}, threshold ${isScore ? '>=' : '<='} ${limit} (pattern ${pattern})`,
        url: result.url,
        suggestion: result.lcpElement?.suggestion,
        docs: 'https://ranklint.dev/en/cli/lighthouse',
      })
    }
  }
  return issues
}

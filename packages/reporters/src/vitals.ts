import type { CruxFieldData, LighthouseMetrics, Report } from '@ranklint/core'

export type CruxMetric = keyof CruxFieldData
export type Rating = 'good' | 'needs-improvement' | 'poor'
export type ScoreKey = 'performance' | 'seo' | 'accessibility' | 'bestPractices'

export const CRUX_METRICS: CruxMetric[] = ['lcp', 'inp', 'cls']

const CRUX_THRESHOLDS: Record<CruxMetric, [number, number]> = {
  lcp: [2500, 4000],
  inp: [200, 500],
  cls: [0.1, 0.25],
}

export const RATING_LABEL: Record<Rating, string> = {
  'good': 'good',
  'needs-improvement': 'needs improvement',
  'poor': 'poor',
}

export const SCORE_LABEL: Record<ScoreKey, string> = {
  performance: 'Performance',
  seo: 'SEO',
  accessibility: 'Accessibility',
  bestPractices: 'Best practices',
}

export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function rateCrux(metric: CruxMetric, value: number): Rating {
  const [good, poor] = CRUX_THRESHOLDS[metric]
  if (value <= good) return 'good'
  return value <= poor ? 'needs-improvement' : 'poor'
}

export function scoreClass(score: number): 'good' | 'average' | 'poor' {
  if (score >= 90) return 'good'
  return score >= 50 ? 'average' : 'poor'
}

export function formatMetric(metric: CruxMetric | keyof LighthouseMetrics, value: number): string {
  if (metric === 'cls') return String(Number(value.toFixed(2)))
  if (metric === 'lcp' || metric === 'inp' || metric === 'tbt') return `${Math.round(value)} ms`
  return String(Math.round(value))
}

export function averageScore(report: Report, key: ScoreKey): number | undefined {
  const scores = (report.lighthouse ?? [])
    .map(entry => entry.metrics[key])
    .filter((score): score is number => typeof score === 'number')
  if (scores.length === 0) return undefined
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

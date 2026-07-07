import { loadConfig } from 'c12'
import { defu } from 'defu'
import { z } from 'zod'
import type { Check, RuleSetting, Severity } from './types'

const customCheckSchema = z.custom<Check>((value) => {
  if (typeof value !== 'object' || value === null) return false
  const check = value as Partial<Check>
  return typeof check.id === 'string'
    && typeof check.run === 'function'
    && (check.scope === 'page' || check.scope === 'site')
    && ['error', 'warn', 'info'].includes(check.severity as string)
}, 'custom check must have id, severity, scope ("page"|"site") and a run() function')

const severitySchema = z.enum(['error', 'warn', 'info'])
const ruleValueSchema = z.union([
  z.enum(['error', 'warn', 'info', 'off']),
  z.tuple([severitySchema, z.record(z.string(), z.unknown())]),
])

export const configSchema = z.object({
  extends: z.array(z.string()).optional(),
  site: z.object({ url: z.string(), name: z.string().optional() }),
  apps: z.record(z.string(), z.object({
    paths: z.array(z.string()),
    owner: z.enum(['self', 'external']).optional(),
    checks: z.array(z.string()).optional(),
  })).optional(),
  rules: z.record(z.string(), ruleValueSchema).optional(),
  crawl: z.object({
    concurrency: z.number().int().positive().optional(),
    delay: z.number().nonnegative().optional(),
    maxPages: z.number().int().positive().optional(),
    ignore: z.array(z.string()).optional(),
    strategy: z.enum(['full', 'sitemap+sample']).optional(),
    userAgent: z.string().optional(),
    viewport: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }).optional(),
    auth: z.object({
      headers: z.record(z.string(), z.string()).optional(),
      basic: z.object({ username: z.string(), password: z.string() }).optional(),
      cookies: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
    }).optional(),
  }).optional(),
  robots: z.object({
    mode: z.enum(['owner', 'external']).optional(),
    expect: z.object({
      allow: z.array(z.string()).optional(),
      disallow: z.array(z.string()).optional(),
      sitemaps: z.array(z.string()).optional(),
      indexable: z.boolean().optional(),
    }).optional(),
  }).optional(),
  lighthouse: z.object({
    enabled: z.boolean().optional(),
    runs: z.number().int().positive().optional(),
    aggregation: z.enum(['median', 'p75', 'best']).optional(),
    formFactor: z.enum(['mobile', 'desktop']).optional(),
    maxUrls: z.number().int().positive().optional(),
    thresholds: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  }).optional(),
  customChecks: z.array(customCheckSchema).optional(),
  monitor: z.object({
    storage: z.enum(['fs', 's3']).optional(),
    dir: z.string().optional(),
    keep: z.number().int().positive().optional(),
    bucket: z.string().optional(),
    prefix: z.string().optional(),
    endpoint: z.string().optional(),
    region: z.string().optional(),
  }).optional(),
  profiles: z.record(z.string(), z.unknown()).optional(),
})

export type RanklintUserConfig = z.infer<typeof configSchema>

export function configJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(configSchema, { unrepresentable: 'any', io: 'input' }) as Record<string, unknown>
}

export function defineRanklintConfig(config: RanklintUserConfig): RanklintUserConfig {
  return config
}

export async function loadRanklintConfig(
  opts: { cwd?: string, profile?: string } = {},
): Promise<RanklintUserConfig> {
  const { config } = await loadConfig<RanklintUserConfig>({ name: 'seo', cwd: opts.cwd })
  if (!config || Object.keys(config).length === 0) {
    throw new Error('seo.config.{ts,js,mjs} not found')
  }
  let merged: unknown = config
  if (opts.profile) {
    const profile = config.profiles?.[opts.profile]
    if (!profile) throw new Error(`Unknown profile "${opts.profile}"`)
    merged = defu(profile, config)
  }
  const parsed = configSchema.safeParse(merged)
  if (!parsed.success) {
    const details = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid seo.config: ${details}`)
  }
  return parsed.data
}

export interface RuleRegistryEntry {
  defaultSeverity: Severity
  schema?: z.ZodType
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => {
    const row = new Array<number>(b.length + 1).fill(0)
    row[0] = i
    return row
  })
  for (let j = 0; j <= b.length; j++) dp[0]![j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }
  return dp[a.length]![b.length]!
}

function didYouMean(input: string, candidates: string[]): string | undefined {
  let best: { candidate: string, distance: number } | undefined
  for (const candidate of candidates) {
    const distance = levenshtein(input, candidate)
    if (!best || distance < best.distance) best = { candidate, distance }
  }
  return best && best.distance <= 3 ? best.candidate : undefined
}

export function resolveRules(
  userRules: RanklintUserConfig['rules'],
  registry: Map<string, RuleRegistryEntry>,
): Map<string, RuleSetting> {
  const resolved = new Map<string, RuleSetting>()
  for (const [id, entry] of registry) {
    resolved.set(id, { severity: entry.defaultSeverity, options: {} })
  }
  for (const [id, value] of Object.entries(userRules ?? {})) {
    if (!registry.has(id)) {
      const hint = didYouMean(id, [...registry.keys()])
      throw new Error(`Unknown rule "${id}"${hint ? `. Did you mean "${hint}"?` : ''}`)
    }
    if (value === 'off') {
      resolved.set(id, 'off')
      continue
    }
    const [severity, options] = Array.isArray(value) ? value : [value, {}]
    const schema = registry.get(id)!.schema
    if (schema) {
      const parsed = schema.safeParse(options)
      if (!parsed.success) {
        const details = parsed.error.issues.map(i => i.message).join('; ')
        throw new Error(`Invalid options for rule "${id}": ${details}`)
      }
      resolved.set(id, { severity, options: parsed.data as Record<string, unknown> })
      continue
    }
    resolved.set(id, { severity, options })
  }
  return resolved
}

export interface RobotsGroup {
  userAgents: string[]
  allow: string[]
  disallow: string[]
}

export interface ParsedRobots {
  groups: RobotsGroup[]
  sitemaps: string[]
}

export function parseRobotsTxt(text: string): ParsedRobots {
  const groups: RobotsGroup[] = []
  const sitemaps: string[] = []
  let current: RobotsGroup | null = null
  let collectingAgents = false

  for (const rawLine of text.split('\n')) {
    const line = rawLine.split('#')[0]!.trim()
    if (!line) continue
    const sep = line.indexOf(':')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim().toLowerCase()
    const value = line.slice(sep + 1).trim()

    if (key === 'sitemap') {
      if (value) sitemaps.push(value)
      continue
    }
    if (key === 'user-agent') {
      if (!collectingAgents) {
        current = { userAgents: [], allow: [], disallow: [] }
        groups.push(current)
        collectingAgents = true
      }
      current!.userAgents.push(value.toLowerCase())
      continue
    }
    collectingAgents = false
    if (!current) continue
    if (key === 'allow') current.allow.push(value)
    if (key === 'disallow') current.disallow.push(value)
  }
  return { groups, sitemaps }
}

function groupsFor(parsed: ParsedRobots, userAgent: string): RobotsGroup[] {
  const ua = userAgent.toLowerCase()
  let token = ''
  for (const group of parsed.groups) {
    for (const agent of group.userAgents) {
      if (agent !== '*' && ua.includes(agent) && agent.length > token.length) token = agent
    }
  }
  const wanted = token || '*'
  return parsed.groups.filter(g => g.userAgents.includes(wanted))
}

const patternCache = new Map<string, { re: RegExp, length: number }>()

function normalizeEncoding(value: string): string {
  return value
    .replace(/[^\p{ASCII}]+/gu, m => encodeURIComponent(m))
    .replace(/%[0-9a-f]{2}/gi, m => m.toUpperCase())
}

function compile(rule: string): { re: RegExp, length: number } {
  let compiled = patternCache.get(rule)
  if (!compiled) {
    const normalized = normalizeEncoding(rule)
    const anchored = normalized.endsWith('$')
    const body = anchored ? normalized.slice(0, -1) : normalized
    const source = body.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')
    compiled = { re: new RegExp(`^${source}${anchored ? '$' : ''}`), length: normalized.length }
    patternCache.set(rule, compiled)
  }
  return compiled
}

function matchLength(rule: string, path: string): number {
  if (rule === '') return -1
  const { re, length } = compile(rule)
  return re.test(path) ? length : -1
}

export function isPathDisallowed(parsed: ParsedRobots, path: string, userAgent = '*'): boolean {
  const target = normalizeEncoding(path)
  let best: { type: 'allow' | 'disallow', length: number } | undefined
  for (const group of groupsFor(parsed, userAgent)) {
    for (const rule of group.allow) {
      const length = matchLength(rule, target)
      if (length >= 0 && (!best || length >= best.length)) best = { type: 'allow', length }
    }
    for (const rule of group.disallow) {
      const length = matchLength(rule, target)
      if (length >= 0 && (!best || length > best.length)) best = { type: 'disallow', length }
    }
  }
  return best?.type === 'disallow'
}

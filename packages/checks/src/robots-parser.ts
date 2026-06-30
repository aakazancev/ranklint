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

function groupFor(parsed: ParsedRobots, userAgent: string): RobotsGroup | undefined {
  const ua = userAgent.toLowerCase()
  return parsed.groups.find(g => g.userAgents.some(a => a !== '*' && ua.includes(a)))
    ?? parsed.groups.find(g => g.userAgents.includes('*'))
}

function ruleMatches(rule: string, path: string): boolean {
  if (rule === '') return false
  const prefix = rule.endsWith('*') ? rule.slice(0, -1) : rule
  return path.startsWith(prefix)
}

export function isPathDisallowed(parsed: ParsedRobots, path: string, userAgent = '*'): boolean {
  const group = groupFor(parsed, userAgent)
  if (!group) return false
  let best: { type: 'allow' | 'disallow', length: number } | undefined
  for (const rule of group.allow) {
    if (ruleMatches(rule, path) && (!best || rule.length >= best.length)) {
      best = { type: 'allow', length: rule.length }
    }
  }
  for (const rule of group.disallow) {
    if (ruleMatches(rule, path) && (!best || rule.length > best.length)) {
      best = { type: 'disallow', length: rule.length }
    }
  }
  return best?.type === 'disallow'
}

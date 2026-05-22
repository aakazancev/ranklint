function toRegExp(pattern: string): RegExp {
  const source = pattern
    .split('/')
    .map((seg) => {
      if (seg === '**') return '.*'
      return seg.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')
    })
    .join('/')
  return new RegExp(`^${source}$`)
}

export function matchPattern(pattern: string, path: string): boolean {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3)
    if (prefix === '') return true
    return path === prefix || path.startsWith(`${prefix}/`)
  }
  return toRegExp(pattern).test(path)
}

export function patternSpecificity(pattern: string): number {
  return pattern.replace(/\*/g, '').length
}

export function mostSpecific(patterns: string[], path: string): string | undefined {
  return patterns
    .filter(p => matchPattern(p, path))
    .sort((a, b) => patternSpecificity(b) - patternSpecificity(a))[0]
}

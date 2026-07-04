const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function routePatternOf(path: string): string {
  const segments = path.split('/').map((segment) => {
    if (segment === '') return segment
    if (/^\d+$/.test(segment)) return '*'
    if (UUID.test(segment)) return '*'
    if (segment.length > 24) return '*'
    if (/\d/.test(segment) && segment.length > 8) return '*'
    return segment
  })
  return segments.join('/') || '/'
}

export function sampleUrls(urls: string[], perGroup = 5): string[] {
  const groups = new Map<string, string[]>()
  for (const url of urls) {
    let path: string
    try {
      path = new URL(url).pathname
    } catch {
      continue
    }
    const pattern = routePatternOf(path)
    const list = groups.get(pattern) ?? []
    list.push(url)
    groups.set(pattern, list)
  }
  const sampled: string[] = []
  for (const list of groups.values()) {
    sampled.push(...list.slice(0, perGroup))
  }
  return sampled
}

import type { CrawlBudgetGroup, CrawlBudgetReport, PageSnapshot } from './types'
import { getDocument } from './runner'
import { routePatternOf } from './sample'

export function analyzeCrawlBudget(snapshots: PageSnapshot[]): CrawlBudgetReport | undefined {
  const groups = new Map<string, CrawlBudgetGroup>()
  let parametricUrls = 0
  let junkUrls = 0

  for (const snapshot of snapshots) {
    if (snapshot.statusCode !== 200) continue
    let url: URL
    try {
      url = new URL(snapshot.url)
    } catch {
      continue
    }
    const params = [...url.searchParams.keys()].sort()
    if (params.length === 0) continue
    parametricUrls++

    const doc = getDocument(snapshot)
    const hasCanonical = Boolean(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'))
    const hasNoindex = (doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')
      .toLowerCase()
      .includes('noindex')
    if (!hasCanonical && !hasNoindex) junkUrls++

    const key = `${routePatternOf(url.pathname)}?${params.join(',')}`
    const group = groups.get(key) ?? {
      pattern: routePatternOf(url.pathname),
      params,
      count: 0,
      withCanonical: 0,
      withNoindex: 0,
      sample: [],
    }
    group.count++
    if (hasCanonical) group.withCanonical++
    if (hasNoindex) group.withNoindex++
    if (group.sample.length < 3) group.sample.push(snapshot.url)
    groups.set(key, group)
  }

  if (parametricUrls === 0) return undefined
  return {
    parametricUrls,
    junkUrls,
    groups: [...groups.values()].sort((a, b) => b.count - a.count),
  }
}

const TRACKING_PARAMS = new Set(['gclid', 'gbraid', 'wbraid', 'fbclid', 'yclid', 'msclkid', '_gl', 'mc_cid', 'mc_eid'])

function paramName(pair: string): string {
  const raw = pair.split('=', 1)[0]!
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '))
  } catch {
    return raw
  }
}

function isTrackingParam(pair: string): boolean {
  const name = paramName(pair)
  return name.startsWith('utm_') || TRACKING_PARAMS.has(name)
}

export function normalizeUrl(href: string, base: string): string | null {
  try {
    const u = new URL(href, base)
    u.hash = ''
    if (u.search) {
      const pairs = u.search.slice(1).split('&')
      const kept = pairs.filter(pair => !isTrackingParam(pair))
      if (kept.length < pairs.length) {
        const nonEmpty = kept.filter(pair => pair !== '')
        u.search = nonEmpty.length > 0 ? `?${nonEmpty.join('&')}` : ''
      }
    }
    return u.toString()
  } catch {
    return null
  }
}

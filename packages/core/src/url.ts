export function normalizeUrl(href: string, base: string): string | null {
  try {
    const u = new URL(href, base)
    u.hash = ''
    return u.toString()
  } catch {
    return null
  }
}

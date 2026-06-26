import type { SitemapSourceEntry } from '../../../options'

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(siteUrl: string, entries: SitemapSourceEntry[]): string {
  const seen = new Set<string>()
  const lines: string[] = []
  lines.push('<?xml version="1.0" encoding="UTF-8"?>')
  lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
  for (const entry of entries) {
    const loc = entry.loc.startsWith('http') ? entry.loc : `${siteUrl}${entry.loc}`
    if (seen.has(loc)) continue
    seen.add(loc)
    lines.push('  <url>')
    lines.push(`    <loc>${esc(loc)}</loc>`)
    if (entry.lastmod) lines.push(`    <lastmod>${esc(entry.lastmod)}</lastmod>`)
    if (entry.changefreq) lines.push(`    <changefreq>${entry.changefreq}</changefreq>`)
    if (entry.priority !== undefined) lines.push(`    <priority>${entry.priority}</priority>`)
    lines.push('  </url>')
  }
  lines.push('</urlset>')
  lines.push('')
  return lines.join('\n')
}

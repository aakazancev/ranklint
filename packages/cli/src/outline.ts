import type { PageSnapshot } from '@ranklint/core'
import { getDocument } from '@ranklint/core'

export function buildOutline(snapshots: PageSnapshot[]): string {
  const lines: string[] = ['# Heading outline', '']
  const pages = [...snapshots]
    .filter(s => s.statusCode === 200)
    .sort((a, b) => a.url.localeCompare(b.url))
  for (const page of pages) {
    let path: string
    try {
      path = new URL(page.url).pathname
    } catch {
      path = page.url
    }
    lines.push(`## ${path}`)
    lines.push('')
    const headings = [...getDocument(page).querySelectorAll('h1, h2, h3, h4, h5, h6')]
    if (headings.length === 0) {
      lines.push('_(no headings)_')
    }
    for (const el of headings) {
      const level = Number(el.tagName[1])
      const text = el.textContent?.trim() || '(empty)'
      lines.push(`${'  '.repeat(level - 1)}- **h${level}** ${text}`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

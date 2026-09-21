export const START = '<!-- generated:start -->'
export const END = '<!-- generated:end -->'

export function mergeGenerated(existing, frontmatter, generated) {
  if (!existing) {
    return `${frontmatter}\n\n${generated}\n`
  }
  const start = existing.indexOf(START)
  const end = existing.indexOf(END)
  if (start === -1 || end === -1) throw new Error('page has no generated markers')
  const tail = existing.slice(end + END.length)
  return `${frontmatter}\n\n${generated}${tail}`
}

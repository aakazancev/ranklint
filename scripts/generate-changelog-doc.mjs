import { END, START, mergeGenerated } from './lib/generated-md.mjs'

const REPO = 'https://github.com/aakazancev/ranklint'
const KIND = { major: 'breaking', minor: 'feature', patch: 'fix' }
const t = {
  en: { index: 'Changelog', indexDesc: 'What changed in every ranklint release.', date: 'Released', breaking: 'Breaking', feature: 'Features', fix: 'Fixes' },
  ru: { index: 'Изменения', indexDesc: 'Что изменилось в каждом релизе ranklint.', date: 'Дата', breaking: 'Ломающие изменения', feature: 'Новое', fix: 'Исправления' },
}

export function parseChangelog(text) {
  const versions = []
  let current
  let group
  let skipping = false
  for (const line of text.split('\n')) {
    const version = line.match(/^## (\d+\.\d+\.\d+\S*)/)
    if (version) {
      current = { version: version[1], groups: { major: [], minor: [], patch: [] } }
      versions.push(current)
      group = undefined
      continue
    }
    const heading = line.match(/^### (Major|Minor|Patch) Changes/)
    if (heading) {
      group = heading[1].toLowerCase()
      continue
    }
    if (!current || !group) continue
    const bullet = line.match(/^- (.*)$/)
    if (bullet) {
      skipping = bullet[1].startsWith('Updated dependencies')
      if (skipping) continue
      const hashed = bullet[1].match(/^([0-9a-f]{7,40}): (.*)$/)
      current.groups[group].push(hashed ? { hash: hashed[1], text: hashed[2] } : { hash: null, text: bullet[1] })
      continue
    }
    if (skipping && /^\s+- /.test(line)) continue
    const last = current.groups[group].at(-1)
    if (last && /^\s+\S/.test(line)) last.text += ` ${line.trim()}`
  }
  return versions
}

function compareSemver(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i]
  return 0
}

export function mergeChangelogs(inputs) {
  const byVersion = new Map()
  for (const { pkg, text } of inputs) {
    for (const { version, groups } of parseChangelog(text)) {
      const entries = byVersion.get(version) ?? new Map()
      byVersion.set(version, entries)
      for (const [group, bullets] of Object.entries(groups)) {
        for (const bullet of bullets) {
          const key = bullet.hash ?? bullet.text
          const entry = entries.get(key) ?? { kind: KIND[group], hash: bullet.hash, text: bullet.text, packages: [] }
          entry.packages.push(pkg)
          entries.set(key, entry)
        }
      }
    }
  }
  return [...byVersion]
    .map(([version, entries]) => ({ version, entries: [...entries.values()] }))
    .filter(v => v.entries.length)
    .sort((a, b) => compareSemver(a.version, b.version))
}

export function firstParagraph(tail) {
  const paragraphs = tail.split(/\n\s*\n/).map(p => p.trim()).filter(p => p && !p.startsWith('#'))
  return paragraphs[0]?.replace(/\s*\n\s*/g, ' ') ?? ''
}

export function readDate(existing) {
  return existing?.match(/^---\n[\s\S]*?^date: (\d{4}-\d{2}-\d{2})$[\s\S]*?\n---/m)?.[1]
}

function truncate(text, max = 160) {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`
}

export function renderVersionPage(v, date, locale, allPackages) {
  const l = t[locale]
  const frontmatter = ['---', `title: ${JSON.stringify(`ranklint ${v.version}`)}`, `description: ${JSON.stringify(truncate(v.entries[0].text))}`, `date: ${date}`, 'navigation: false', '---'].join('\n')
  const sections = ['breaking', 'feature', 'fix'].flatMap((kind) => {
    const entries = v.entries.filter(e => e.kind === kind)
    if (!entries.length) return []
    const lines = entries.map((e) => {
      const badge = e.packages.length === allPackages.length ? '' : `**${e.packages.join(', ')}**: `
      const link = e.hash ? ` ([${e.hash}](${REPO}/commit/${e.hash}))` : ''
      return `- ${badge}${e.text}${link}`
    })
    return [`### ${l[kind]}`, '', ...lines, '']
  })
  const generated = [START, '', `${l.date}: ${date}`, '', ...sections, END].join('\n')
  return { frontmatter, generated }
}

export function renderIndex(items, locale) {
  const l = t[locale]
  const frontmatter = ['---', `title: ${JSON.stringify(l.index)}`, `description: ${JSON.stringify(l.indexDesc)}`, '---'].join('\n')
  const body = items.flatMap(i => [`## [ranklint ${i.version}](/${locale}/changelog/v${i.version})`, '', `${l.date}: ${i.date}`, '', i.summary, ''])
  return mergeGenerated(undefined, frontmatter, [START, '', ...body, END].join('\n'))
}

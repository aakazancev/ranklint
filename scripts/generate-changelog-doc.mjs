import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { END, START, mergeGenerated } from './lib/generated-md.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const LOCALES = ['en', 'ru']
const REPO = 'https://github.com/aakazancev/ranklint'
const DEP_BUMP = /^@?[\w./-]+@\d+\.\d+\.\d+\S*$/
const KIND = { major: 'breaking', minor: 'feature', patch: 'fix' }
const t = {
  en: { index: 'Changelog', indexDesc: 'What changed in every ranklint release.', date: 'Released', breaking: 'Breaking', feature: 'Features', fix: 'Fixes' },
  ru: { index: 'Изменения', indexDesc: 'Что изменилось в каждом релизе ranklint.', date: 'Дата', breaking: 'Ломающие изменения', feature: 'Новое', fix: 'Исправления' },
}

export function parseChangelog(text) {
  const versions = []
  let current
  let group
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
      if (bullet[1].startsWith('Updated dependencies') || DEP_BUMP.test(bullet[1])) continue
      const hashed = bullet[1].match(/^([0-9a-f]{7,40}): (.*)$/)
      current.groups[group].push(hashed ? { hash: hashed[1], text: hashed[2] } : { hash: null, text: bullet[1] })
      continue
    }
    if (/^\s+- /.test(line)) continue
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
          const key = `${bullet.hash ?? ''}:${bullet.text}`
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

function readPackages() {
  return readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter(e => e.isDirectory() && existsSync(join(root, 'packages', e.name, 'CHANGELOG.md')))
    .map(e => ({ pkg: JSON.parse(readFileSync(join(root, 'packages', e.name, 'package.json'), 'utf8')).name, changelog: `packages/${e.name}/CHANGELOG.md`, text: readFileSync(join(root, 'packages', e.name, 'CHANGELOG.md'), 'utf8') }))
}

export function resolveDate(gitDates, isLatest, version) {
  const date = gitDates.at(-1)
  if (date) return date
  if (!isLatest) throw new Error(`no release date found for ${version} in packages/*/CHANGELOG.md`)
  return new Date().toISOString().slice(0, 10)
}

function gitDate(version, files, isLatest) {
  const out = execFileSync('git', ['log', '--format=%ad', '--date=short', `-S## ${version}`, '--', ...files], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  return resolveDate(out, isLatest, version)
}

function tailOf(existing) {
  if (!existing) return ''
  const end = existing.indexOf(END)
  return end === -1 ? '' : existing.slice(end + END.length)
}

export function build() {
  const inputs = readPackages()
  const allPackages = inputs.map(i => i.pkg)
  const changelogs = inputs.map(i => i.changelog)
  const versions = mergeChangelogs(inputs)
  const out = new Map()
  for (const locale of LOCALES) {
    const base = join(root, 'docs/content', locale, '8.changelog')
    const items = versions.map((v) => {
      const path = join(base, `v${v.version}.md`)
      const existing = existsSync(path) ? readFileSync(path, 'utf8') : undefined
      const date = readDate(existing) ?? gitDate(v.version, changelogs, v.version === versions[0].version)
      const { frontmatter, generated } = renderVersionPage(v, date, locale, allPackages)
      out.set(path, mergeGenerated(existing, frontmatter, generated))
      return { version: v.version, date, summary: firstParagraph(tailOf(existing)) || v.entries[0].text }
    })
    out.set(join(base, 'index.md'), renderIndex(items, locale))
  }
  return out
}

function listExisting() {
  return LOCALES.flatMap((locale) => {
    const base = join(root, 'docs/content', locale, '8.changelog')
    return existsSync(base) ? readdirSync(base).filter(f => f.endsWith('.md')).map(f => join(base, f)) : []
  })
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const pages = build()
  if (process.argv.includes('--check')) {
    const stale = [...pages].filter(([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content).map(([p]) => p)
    const orphans = listExisting().filter(p => !pages.has(p))
    if (stale.length || orphans.length) {
      console.error(`changelog docs are stale — run: node scripts/generate-changelog-doc.mjs\n${[...stale, ...orphans.map(o => `orphan: ${o}`)].join('\n')}`)
      process.exit(1)
    }
    console.log(`changelog docs are up to date (${pages.size} files)`)
  }
  else {
    for (const orphan of listExisting().filter(p => !pages.has(p))) rmSync(orphan)
    for (const [path, content] of pages) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, content)
    }
    console.log(`changelog docs written (${pages.size} files)`)
  }
}

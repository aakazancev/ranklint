import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { allChecks } from '../packages/checks/dist/index.mjs'

const { z } = createRequire(new URL('../packages/checks/package.json', import.meta.url))('zod')
const root = fileURLToPath(new URL('..', import.meta.url))
const i18n = JSON.parse(readFileSync(join(root, 'docs/rules-i18n.json'), 'utf8'))
const START = '<!-- generated:start -->'
const END = '<!-- generated:end -->'

const t = {
  en: { rules: 'Rules', index: 'All rules', why: 'Why it matters', fix: 'How to fix', options: 'Options', none: 'No options.', category: 'Category', scope: 'Scope', severity: 'Default severity', option: 'Option', type: 'Type', description: 'Description', indexDesc: 'Every rule accepts `error`, `warn`, `info`, `off` or `[severity, options]` in ranklint.config and can be suppressed per page with useRanklintIgnore().' },
  ru: { rules: 'Правила', index: 'Все правила', why: 'Почему это важно', fix: 'Как исправить', options: 'Опции', none: 'Опций нет.', category: 'Категория', scope: 'Область', severity: 'Severity по умолчанию', option: 'Опция', type: 'Тип', description: 'Описание', indexDesc: 'Каждое правило принимает `error`, `warn`, `info`, `off` или `[severity, options]` в ranklint.config и отключается на странице через useRanklintIgnore().' },
}

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

function slug(id) {
  return id.replace(/:/g, '-')
}

function optionsTable(check, locale) {
  if (!check.optionsSchema) return t[locale].none
  const schema = z.toJSONSchema(check.optionsSchema, { unrepresentable: 'any', io: 'input' })
  const props = schema.properties ?? {}
  const rows = Object.entries(props).map(([name, def]) => `| \`${name}\` | ${def.type ?? 'any'} | ${def.description ?? ''} |`)
  return [`| ${t[locale].option} | ${t[locale].type} | ${t[locale].description} |`, '| --- | --- | --- |', ...rows].join('\n')
}

function rulePage(check, locale) {
  const desc = i18n[check.id]?.[locale] ?? ''
  const frontmatter = `---\ntitle: "${check.id}"\ndescription: "${desc.replace(/"/g, '\\"')}"\n---`
  const generated = [
    START,
    `| ${t[locale].category} | ${t[locale].scope} | ${t[locale].severity} |`,
    '| --- | --- | --- |',
    `| ${check.category} | ${check.scope} | ${check.severity} |`,
    '',
    desc,
    '',
    `### ${t[locale].options}`,
    '',
    optionsTable(check, locale),
    END,
  ].join('\n')
  return { frontmatter, generated }
}

function indexPage(locale) {
  const rows = [...allChecks]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(c => `| [\`${c.id}\`](/${locale}/rules/${c.category}/${slug(c.id)}) | ${c.category} | ${c.scope} | ${c.severity} | ${i18n[c.id]?.[locale] ?? ''} |`)
  return `---\ntitle: ${t[locale].index}\ndescription: ${allChecks.length} built-in rules generated from the check registry.\n---\n\n${t[locale].indexDesc}\n\n| Rule | ${t[locale].category} | ${t[locale].scope} | ${t[locale].severity} | ${t[locale].description} |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`
}

function build() {
  const out = new Map()
  for (const locale of ['en', 'ru']) {
    const base = join(root, 'docs/content', locale, '6.rules')
    out.set(join(base, '.navigation.yml'), `title: ${t[locale].rules}\nicon: i-lucide-list-checks\n`)
    out.set(join(base, 'index.md'), indexPage(locale))
    for (const check of allChecks) {
      const path = join(base, check.category, `${slug(check.id)}.md`)
      const existing = existsSync(path) ? readFileSync(path, 'utf8') : undefined
      const { frontmatter, generated } = rulePage(check, locale)
      out.set(path, mergeGenerated(existing, frontmatter, generated))
    }
  }
  return out
}

function listExisting() {
  const files = []
  for (const locale of ['en', 'ru']) {
    const base = join(root, 'docs/content', locale, '6.rules')
    if (!existsSync(base)) continue
    const walk = dir => readdirSync(dir, { withFileTypes: true }).forEach((e) => {
      const p = join(dir, e.name)
      e.isDirectory() ? walk(p) : files.push(p)
    })
    walk(base)
  }
  return files
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const pages = build()
  if (process.argv.includes('--check')) {
    const stale = [...pages].filter(([path, content]) => !existsSync(path) || readFileSync(path, 'utf8') !== content).map(([p]) => p)
    const orphans = listExisting().filter(p => !pages.has(p))
    if (stale.length || orphans.length) {
      console.error(`rules docs are stale — run: node scripts/generate-rules-doc.mjs\n${[...stale, ...orphans.map(o => `orphan: ${o}`)].join('\n')}`)
      process.exit(1)
    }
    console.log(`rules docs are up to date (${pages.size} files)`)
  }
  else {
    for (const orphan of listExisting().filter(p => !pages.has(p))) rmSync(orphan)
    for (const [path, content] of pages) {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, content)
    }
    console.log(`rules docs written (${pages.size} files)`)
  }
}

import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export type CiTarget = 'gitlab' | 'github' | 'none'

export interface InitAnswers {
  url: string
  uat?: string
  zones?: string[]
  monitor?: boolean
}

export const ciTargets: CiTarget[] = ['gitlab', 'github', 'none']

export function normalizeSiteUrl(input: string): string {
  let parsed: URL
  try {
    parsed = new URL(input.trim())
  } catch {
    throw new Error(`Invalid url "${input}": provide an absolute http(s) url, e.g. https://example.com`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid url "${input}": provide an absolute http(s) url, e.g. https://example.com`)
  }
  return parsed.href.replace(/\/$/, '')
}

export function parseZones(input: string): string[] {
  return input.split(',').map(zone => zone.trim()).filter(Boolean)
}

function quoted(values: string[]): string {
  return values.map(value => `'${value}'`).join(', ')
}

export function buildInitConfig(answers: InitAnswers): string {
  const body = [`  site: { url: '${answers.url}' },`]
  if (answers.zones && answers.zones.length > 0) {
    body.push(
      '  apps: {',
      `    self: { paths: [${quoted(answers.zones)}] },`,
      '    main: { paths: [\'/**\'], owner: \'external\' },',
      '  },',
    )
  }
  if (answers.monitor) {
    body.push('  monitor: { storage: \'fs\', dir: \'.ranklint/reports\' },')
  }
  if (answers.uat) {
    body.push(
      '  profiles: {',
      `    uat: { site: { url: '${answers.uat}' } },`,
      '  },',
    )
  }
  return [
    'import { defineRanklintConfig } from \'@ranklint/core\'',
    '',
    'export default defineRanklintConfig({',
    ...body,
    '})',
    '',
  ].join('\n')
}

export function ciSnippet(ci: CiTarget, url: string): string {
  if (ci === 'gitlab') {
    return [
      'include:',
      '  - remote: \'https://raw.githubusercontent.com/aakazancev/ranklint/main/presets/gitlab-ci/seo.yml\'',
      '',
      'seo:audit:',
      '  extends: .ranklint-audit',
      '  variables:',
      `    RANKLINT_URL: ${url}`,
      '',
    ].join('\n')
  }
  if (ci === 'github') {
    return [
      'name: seo',
      'on: [pull_request]',
      'jobs:',
      '  seo:',
      '    uses: aakazancev/ranklint/.github/workflows/seo.yml@main',
      `    with: { url: '${url}' }`,
      '',
    ].join('\n')
  }
  return ''
}

export function ciTarget(value: string): CiTarget {
  if (!ciTargets.includes(value as CiTarget)) {
    throw new Error(`Unknown ci "${value}". Available: ${ciTargets.join(', ')}`)
  }
  return value as CiTarget
}

export async function hasDependency(cwd: string, name: string): Promise<boolean> {
  try {
    const pkg = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    return Boolean(pkg.dependencies?.[name] ?? pkg.devDependencies?.[name])
  } catch {
    return false
  }
}

export async function detectNuxt(cwd: string): Promise<boolean> {
  const configs = ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs']
  if (!configs.some(file => existsSync(join(cwd, file)))) return false
  return !(await hasDependency(cwd, '@ranklint/nuxt'))
}

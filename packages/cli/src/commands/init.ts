import { existsSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { loadRanklintConfig } from '@ranklint/core'
import { defineCommand } from 'citty'
import { consola } from 'consola'
import {
  buildInitConfig,
  ciSnippet,
  ciTarget,
  detectNuxt,
  hasDependency,
  normalizeSiteUrl,
  parseZones,
  type CiTarget,
  type InitAnswers,
} from '../init'

async function ask(args: { url?: string }): Promise<{ answers: InitAnswers, ci: CiTarget }> {
  const url = normalizeSiteUrl(args.url ?? await consola.prompt('Site url', { type: 'text', placeholder: 'https://example.com' }))
  const answers: InitAnswers = { url }
  if (await consola.prompt('Do you need a profile for UAT/staging?', { type: 'confirm', initial: false })) {
    answers.uat = normalizeSiteUrl(await consola.prompt('UAT url', { type: 'text', placeholder: 'https://uat.example.com' }))
  }
  if (await consola.prompt('Do several apps share this domain?', { type: 'confirm', initial: false })) {
    answers.zones = parseZones(await consola.prompt('Glob paths of your own zone (comma separated)', { type: 'text', placeholder: '/en/market/**,/ar/market/**' }))
  }
  const ci = ciTarget(await consola.prompt('CI provider', { type: 'select', options: ['gitlab', 'github', 'none'], initial: 'none' }) as string)
  answers.monitor = await consola.prompt('Enable scheduled production monitoring?', { type: 'confirm', initial: false })
  return { answers, ci }
}

export const init = defineCommand({
  meta: {
    name: 'init',
    description: 'Create ranklint.config.ts: asks for the site url, profiles, zones, CI and monitoring',
  },
  args: {
    yes: { type: 'boolean', description: 'Non-interactive mode, requires --url' },
    url: { type: 'string', description: 'Production url of the site' },
    uat: { type: 'string', description: 'UAT/staging url, generates a "uat" profile' },
    zones: { type: 'string', description: 'Comma separated glob paths of your own zone on a shared domain' },
    ci: { type: 'string', description: 'Print a pipeline snippet: gitlab | github | none' },
    force: { type: 'boolean', description: 'Overwrite an existing ranklint.config.ts' },
    cwd: { type: 'string', description: 'Directory to create the config in' },
  },
  async run({ args }) {
    const cwd = resolve(args.cwd ?? process.cwd())
    let answers: InitAnswers
    let ci: CiTarget
    if (args.yes) {
      if (!args.url) throw new Error('Provide --url <url> with --yes')
      answers = { url: normalizeSiteUrl(args.url) }
      if (args.uat) answers.uat = normalizeSiteUrl(args.uat)
      if (args.zones) answers.zones = parseZones(args.zones)
      ci = ciTarget(args.ci ?? 'none')
    } else {
      if (!process.stdin.isTTY) throw new Error('init is interactive: use --yes with --url <url> in a non-interactive shell')
      const asked = await ask(args)
      answers = asked.answers
      ci = asked.ci
    }

    const file = join(cwd, 'ranklint.config.ts')
    if (existsSync(file) && !args.force) {
      const overwrite = args.yes
        ? false
        : await consola.prompt(`${file} already exists. Overwrite?`, { type: 'confirm', initial: false })
      if (!overwrite) {
        consola.info('Kept the existing ranklint.config.ts, nothing written')
        return
      }
    }
    await writeFile(file, buildInitConfig(answers))
    consola.success(`Created ${file}`)

    try {
      await loadRanklintConfig({ cwd })
      consola.success('config is valid')
    } catch (error) {
      const message = (error as Error).message
      if (message.startsWith('Invalid ranklint.config')) {
        consola.error(message)
        process.exitCode = 1
        return
      }
      consola.warn(`Could not load the config yet: ${message.split('\n')[0]}`)
      if (!await hasDependency(cwd, '@ranklint/core')) consola.info('Install the config helper: npm i -D @ranklint/core')
    }

    const snippet = ciSnippet(ci, answers.url)
    if (snippet) {
      const target = ci === 'gitlab' ? '.gitlab-ci.yml' : '.github/workflows/seo.yml'
      consola.info(`Add this to ${target} (no file was created):\n\n${snippet}`)
    }

    if (await detectNuxt(cwd)) {
      consola.info('Nuxt detected: npx nuxi module add @ranklint/nuxt')
    }

    consola.info(`Next: ranklint audit --url ${answers.url}`)
  },
})

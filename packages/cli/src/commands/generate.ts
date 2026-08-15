import { writeFile } from 'node:fs/promises'
import { defineCommand } from 'citty'
import { loadRanklintConfig } from '@ranklint/core'
import { buildRobotsFragment } from '../robots-fragment'

const robotsFragment = defineCommand({
  meta: {
    name: 'robots-fragment',
    description: 'Print a robots.txt fragment for the team owning the root robots.txt',
  },
  args: {
    cwd: { type: 'string', description: 'Directory to look up ranklint.config in' },
    output: { type: 'string', description: 'Write the fragment to a file instead of stdout' },
  },
  async run({ args }) {
    const config = await loadRanklintConfig({ cwd: args.cwd })
    const fragment = buildRobotsFragment(config)
    if (args.output) await writeFile(args.output, fragment)
    else process.stdout.write(fragment)
  },
})

export const generate = defineCommand({
  meta: {
    name: 'generate',
    description: 'Generate artifacts from ranklint.config',
  },
  subCommands: {
    'robots-fragment': robotsFragment,
  },
})

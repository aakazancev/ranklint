import { defineCommand, runMain } from 'citty'
import { audit } from './commands/audit'
import { diff } from './commands/diff'
import { generate } from './commands/generate'

const main = defineCommand({
  meta: {
    name: 'ranklint',
    description: 'Lint your SEO before Google does',
  },
  subCommands: {
    audit,
    diff,
    generate,
  },
})

runMain(main)

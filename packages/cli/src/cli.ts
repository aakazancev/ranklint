import { defineCommand, runMain } from 'citty'
import { audit } from './commands/audit'
import { diff } from './commands/diff'

const main = defineCommand({
  meta: {
    name: 'ranklint',
    description: 'Lint your SEO before Google does',
  },
  subCommands: {
    audit,
    diff,
  },
})

runMain(main)

import { defineCommand, runMain } from 'citty'
import { audit } from './commands/audit'

const main = defineCommand({
  meta: {
    name: 'ranklint',
    description: 'Lint your SEO before Google does',
  },
  subCommands: {
    audit,
  },
})

runMain(main)

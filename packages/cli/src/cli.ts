import { defineCommand, runMain } from 'citty'
import { audit } from './commands/audit'
import { diff } from './commands/diff'
import { generate } from './commands/generate'
import { lighthouse } from './commands/lighthouse'
import { outline } from './commands/outline'
import { watch } from './commands/watch'

const main = defineCommand({
  meta: {
    name: 'ranklint',
    description: 'Lint your SEO before Google does',
  },
  subCommands: {
    audit,
    diff,
    generate,
    lighthouse,
    outline,
    watch,
  },
})

runMain(main)

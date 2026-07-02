import { join } from 'node:path'
import { defineCommand } from 'citty'
import { startWatch } from '../watch'

export const watch = defineCommand({
  meta: {
    name: 'watch',
    description: 'Watch app/pages and run fast SEO checks against the dev server on change',
  },
  args: {
    url: { type: 'string', default: 'http://localhost:3000', description: 'Dev server URL' },
    pages: { type: 'string', default: join('app', 'pages'), description: 'Pages directory to watch' },
  },
  async run({ args }) {
    process.stdout.write(`ranklint watch: ${args.pages} -> ${args.url}\n\n`)
    const watcher = startWatch({ pagesDir: args.pages, baseUrl: args.url })
    await new Promise<void>((resolve) => {
      process.once('SIGINT', () => {
        watcher.close().finally(resolve)
      })
    })
  },
})

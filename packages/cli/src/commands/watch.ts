import { dirname, join } from 'node:path'
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
    app: { type: 'string', description: 'App directory: changes outside pages/ re-check recent routes (default: parent of pages)' },
  },
  async run({ args }) {
    process.stdout.write(`ranklint watch: ${args.pages} -> ${args.url}\n\n`)
    const watcher = startWatch({ pagesDir: args.pages, appDir: args.app ?? dirname(args.pages), baseUrl: args.url })
    await new Promise<void>((resolve) => {
      process.once('SIGINT', () => {
        watcher.close().finally(resolve)
      })
    })
  },
})

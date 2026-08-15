import { writeFile } from 'node:fs/promises'
import { defineCommand } from 'citty'
import { crawl, loadRanklintConfig, type RanklintUserConfig } from '@ranklint/core'
import { buildOutline } from '../outline'
import { PlaywrightFetcher } from '../playwright-fetcher'

export const outline = defineCommand({
  meta: {
    name: 'outline',
    description: 'Export the heading tree (h1-h6) of every crawled page as markdown',
  },
  args: {
    url: { type: 'string', required: true, description: 'URL to crawl' },
    output: { type: 'string', description: 'Write to a file instead of stdout' },
    cwd: { type: 'string', description: 'Directory to look up ranklint.config in' },
  },
  async run({ args }) {
    let config: RanklintUserConfig
    try {
      config = await loadRanklintConfig({ cwd: args.cwd })
    } catch {
      config = { site: { url: new URL(args.url).origin } }
    }
    const fetcher = new PlaywrightFetcher({ auth: config.crawl?.auth, viewport: config.crawl?.viewport })
    try {
      const result = await crawl(fetcher, [args.url], {
        siteUrl: config.site.url,
        apps: config.apps,
        ignore: config.crawl?.ignore,
        concurrency: config.crawl?.concurrency,
        maxPages: config.crawl?.maxPages,
      })
      const output = buildOutline(result.snapshots)
      if (args.output) await writeFile(args.output, output)
      else process.stdout.write(output)
    } finally {
      await fetcher.close()
    }
  },
})

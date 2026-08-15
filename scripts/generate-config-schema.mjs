import { readFileSync, writeFileSync } from 'node:fs'
import { configJsonSchema } from '../packages/core/dist/index.mjs'

const target = new URL('../schemas/ranklint-config.schema.json', import.meta.url).pathname
const schema = configJsonSchema()
schema.$schema = 'http://json-schema.org/draft-07/schema#'
schema.title = 'ranklint ranklint.config'
const output = `${JSON.stringify(schema, null, 2)}\n`

if (process.argv.includes('--check')) {
  const current = (() => {
    try {
      return readFileSync(target, 'utf8')
    } catch {
      return ''
    }
  })()
  if (current !== output) {
    console.error('schemas/ranklint-config.schema.json is stale — run: node scripts/generate-config-schema.mjs')
    process.exit(1)
  }
  console.log('ranklint-config.schema.json is up to date')
} else {
  writeFileSync(target, output)
  console.log(`ranklint-config.schema.json written (${Object.keys(schema.properties ?? {}).length} top-level keys)`)
}

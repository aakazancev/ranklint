import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const LIMIT = 5 * 1024
const runtimeDir = new URL('../packages/nuxt/dist/runtime', import.meta.url).pathname

function collect(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name === 'server' || name === 'devtools') return []
      return collect(path)
    }
    return /\.(mjs|js)$/.test(name) ? [path] : []
  })
}

const files = collect(runtimeDir)
const total = files.reduce((sum, f) => sum + gzipSync(readFileSync(f)).length, 0)

console.log(`client runtime: ${total} bytes gzip (limit ${LIMIT})`)
if (total > LIMIT) {
  console.error(`BUNDLE GUARD FAILED: ${total} > ${LIMIT}`)
  process.exit(1)
}

const devtoolsClient = new URL('../packages/devtools/dist/client/main.mjs', import.meta.url).pathname
if (existsSync(devtoolsClient)) {
  const source = readFileSync(devtoolsClient, 'utf8')
  const bare = [...source.matchAll(/(?:^|[;}])\s*(?:import|export)[^;]*?from\s*["']([^."'/][^"']*)["']/g)]
    .map(m => m[1])
    .filter(id => !id.startsWith('node:'))
  console.log(`devtools client: self-contained (${bare.length} bare imports)`)
  if (bare.length > 0) {
    console.error(`BUNDLE GUARD FAILED: devtools client has bare imports: ${[...new Set(bare)].join(', ')}`)
    process.exit(1)
  }
}

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

const LIMIT = 5 * 1024 // 5 KB gzip — принцип zero prod impact (ТЗ §2)
const runtimeDir = new URL('../packages/nuxt/dist/runtime', import.meta.url).pathname

function collect(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      // server/ и devtools/ не попадают в клиентский бандл
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

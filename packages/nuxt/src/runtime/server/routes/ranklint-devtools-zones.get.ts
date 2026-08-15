import type { ResolvedRanklintOptions } from '../../../options'
import { defineEventHandler, useRuntimeConfig } from '#imports'
import { loadRanklintConfig } from '@ranklint/core'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event).ranklint as ResolvedRanklintOptions
  try {
    const seo = await loadRanklintConfig({ cwd: config.rootDir || undefined })
    return { apps: seo.apps ?? null }
  } catch {
    return { apps: null }
  }
})

import type { Report } from '@ranklint/core'
import { json } from './json'
import { junit } from './junit'
import { markdown } from './markdown'

export type Reporter = (report: Report) => string
export type ReporterName = 'json' | 'markdown' | 'junit'

export const reporters: Record<ReporterName, Reporter> = { json, markdown, junit }

export { json, junit, markdown }

export const packageName = '@ranklint/reporters'

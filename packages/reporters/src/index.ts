import type { Report } from '@ranklint/core'
import { gitlab } from './gitlab'
import { html } from './html'
import { json } from './json'
import { junit } from './junit'
import { markdown } from './markdown'

export { markdownDiff } from './markdown-diff'
export { slackPayload, telegramText } from './notifications'

export type Reporter = (report: Report) => string
export type ReporterName = 'json' | 'markdown' | 'junit' | 'gitlab' | 'html'

export const reporters: Record<ReporterName, Reporter> = { json, markdown, junit, gitlab, html }

export { gitlab, html, json, junit, markdown }

export const packageName = '@ranklint/reporters'

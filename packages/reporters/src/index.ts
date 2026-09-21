import type { Report } from '@ranklint/core'
import { github } from './github'
import { gitlab } from './gitlab'
import { html } from './html'
import { json } from './json'
import { junit } from './junit'
import { markdown } from './markdown'
import { sarif } from './sarif'

export { markdownDiff } from './markdown-diff'
export { slackPayload, telegramText } from './notifications'

export type Reporter = (report: Report) => string
export type ReporterName = 'json' | 'markdown' | 'junit' | 'gitlab' | 'html' | 'github' | 'sarif'

export const reporters: Record<ReporterName, Reporter> = { json, markdown, junit, gitlab, html, github, sarif }

export { github, gitlab, html, json, junit, markdown, sarif }

export const packageName = '@ranklint/reporters'

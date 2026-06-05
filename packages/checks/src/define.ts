import type { Check } from '@ranklint/core'
import type { z } from 'zod'

export interface CheckDefinition extends Check {
  docs: string
  optionsSchema?: z.ZodType
}

export function defineCheck(definition: CheckDefinition): CheckDefinition {
  return definition
}

export function docsUrl(id: string): string {
  return `https://ranklint.dev/rules/${id.replace(/:/g, '-')}`
}

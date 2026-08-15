import type { PageSnapshot } from '@ranklint/core'

export { matchPattern, mostSpecific, patternSpecificity } from '../../../core/src/route-pattern'
export { routePatternOf } from '../../../core/src/sample'
export { classifyUrl } from '../../../core/src/zones'

export function getDocument(snapshot: PageSnapshot): Document {
  return new DOMParser().parseFromString(snapshot.html, 'text/html')
}

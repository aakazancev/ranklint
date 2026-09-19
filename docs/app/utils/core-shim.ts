import type { PageSnapshot } from '@ranklint/core'

export { mostSpecific } from '../../../packages/core/src/route-pattern'
export { routePatternOf } from '../../../packages/core/src/sample'

export function getDocument(snapshot: PageSnapshot): Document {
  return new DOMParser().parseFromString(snapshot.html, 'text/html')
}

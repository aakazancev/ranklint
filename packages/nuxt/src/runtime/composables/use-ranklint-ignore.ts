import { useHead } from '#imports'

export function useRanklintIgnore(ruleIds: string[]) {
  useHead({
    meta: [{ name: 'ranklint:ignore', content: ruleIds.join(',') }],
  })
}

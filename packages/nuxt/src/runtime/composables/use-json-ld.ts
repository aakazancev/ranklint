import { useHead } from '#imports'

export function useJsonLd(type: string, data: Record<string, unknown>) {
  if (import.meta.dev) {
    import('@ranklint/checks/schema-org').then(({ validateSchemaOrg }) => {
      for (const issue of validateSchemaOrg(type, data)) {
        console.warn(`[ranklint] useJsonLd(${type}): ${issue.path} — ${issue.message}`)
      }
    })
  }
  useHead({
    script: [{
      type: 'application/ld+json',
      innerHTML: JSON.stringify({ '@context': 'https://schema.org', '@type': type, ...data }),
    }],
  })
}

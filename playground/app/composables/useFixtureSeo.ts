export interface FixtureSeoOverrides {
  title?: string | null
  description?: string | null
  canonical?: string | null
  og?: false
}

export function useFixtureSeo(overrides: FixtureSeoOverrides = {}) {
  const url = useRequestURL()
  const title = overrides.title === undefined
    ? `Fixture ${url.pathname} — long enough title tag`
    : overrides.title
  const description = overrides.description === undefined
    ? `This fixture page at ${url.pathname} carries a description long enough to pass the seventy character minimum.`
    : overrides.description
  const canonical = overrides.canonical === undefined
    ? `${url.origin}${url.pathname}`
    : overrides.canonical

  useHead({
    ...(title !== null ? { title } : {}),
    meta: [
      ...(description !== null ? [{ name: 'description', content: description }] : []),
      ...(overrides.og === false
        ? []
        : [
            { property: 'og:title', content: title ?? 'Fixture og title' },
            { property: 'og:description', content: description ?? 'Fixture og description' },
            { property: 'og:image', content: `${url.origin}/og-image.png` },
            { name: 'twitter:card', content: 'summary' },
          ]),
    ],
    link: canonical !== null ? [{ rel: 'canonical', href: canonical }] : [],
  })
}

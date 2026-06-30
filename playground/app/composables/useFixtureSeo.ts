export interface FixtureSeoOverrides {
  title?: string | null
  description?: string | null
  canonical?: string | null
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
    meta: description !== null ? [{ name: 'description', content: description }] : [],
    link: canonical !== null ? [{ rel: 'canonical', href: canonical }] : [],
  })
}

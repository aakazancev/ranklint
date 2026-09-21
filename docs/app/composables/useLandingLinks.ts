import { computed } from 'vue'

export const RANKLINT_REPO = 'https://github.com/aakazancev/ranklint'

export function useLandingLinks() {
  const { locale } = useI18n()
  const prefix = computed(() => `/${locale.value}`)

  return computed(() => ({
    introduction: `${prefix.value}/getting-started/introduction`,
    installation: `${prefix.value}/getting-started/installation`,
    rules: `${prefix.value}/rules`,
    rulePath: (first: string) => `${prefix.value}${first}`,
    audit: `${prefix.value}/cli/audit`,
    diff: `${prefix.value}/cli/diff-and-ci`,
    monitor: `${prefix.value}/cli/monitor`,
    zones: `${prefix.value}/cli/zones`,
    lighthouse: `${prefix.value}/cli/lighthouse`,
    module: `${prefix.value}/module/overview`,
    devtools: `${prefix.value}/module/devtools`,
    composables: `${prefix.value}/module/composables`,
    customRules: `${prefix.value}/advanced/custom-rules`,
    config: `${prefix.value}/config/reference`,
    changelog: `${prefix.value}/changelog`,
    guide: `${prefix.value}/guides/seo-checklist-nuxt`,
    repo: RANKLINT_REPO,
    releases: `${RANKLINT_REPO}/releases`,
    issues: `${RANKLINT_REPO}/issues`,
    license: `${RANKLINT_REPO}/blob/main/LICENSE`,
  }))
}

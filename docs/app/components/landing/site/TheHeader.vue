<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const { t, locale } = useI18n()
const links = useLandingLinks()
const route = useRoute()

const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))

const items = computed(() => [
  { label: t('landing.nav.docs'), to: links.value.introduction },
  { label: t('landing.nav.rules'), to: links.value.rules },
  { label: t('landing.nav.cli'), to: links.value.audit },
  { label: t('landing.nav.monitor'), to: links.value.monitor },
  { label: t('landing.nav.changelog'), to: links.value.changelog },
])
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line-soft bg-ink-950/85 backdrop-blur">
    <a
      href="#content"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:rounded-lg focus:bg-acid focus:px-4 focus:py-2 focus:text-ink-950"
    >
      {{ t('landing.nav.skipToContent') }}
    </a>

    <div class="container-page flex h-19 items-center justify-between gap-6">
      <div class="flex items-center gap-11">
        <NuxtLink
          :to="`/${locale}`"
          class="flex items-center gap-2.5 no-underline"
        >
          <SiteWordmark size="text-lg" />
        </NuxtLink>

        <nav
          class="hidden items-center gap-7 lg:flex"
          :aria-label="t('landing.nav.docs')"
        >
          <NuxtLink
            v-for="link in items"
            :key="link.to"
            :to="link.to"
            class="text-[15px] text-fg-muted no-underline transition-colors hover:text-fg"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
      </div>

      <div class="flex items-center gap-3 sm:gap-4">
        <div class="hidden sm:block">
          <LangSwitch />
        </div>

        <a
          :href="links.repo"
          rel="noopener"
          :aria-label="t('landing.nav.github')"
          class="hidden size-11 items-center justify-center rounded-xl border border-line text-fg-muted transition-colors hover:text-fg sm:flex"
        >
          <IconSet name="github" />
        </a>

        <ButtonLink :to="links.installation">
          {{ t('landing.nav.start') }}
        </ButtonLink>

        <button
          type="button"
          class="flex size-11 items-center justify-center rounded-xl border border-line text-fg-muted lg:hidden"
          :aria-expanded="open"
          aria-controls="mobile-nav"
          :aria-label="t('landing.nav.docs')"
          @click="open = !open"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            class="size-5"
          >
            <path
              :d="open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div
      v-if="open"
      id="mobile-nav"
      class="border-t border-line-soft bg-ink-950 lg:hidden"
    >
      <div class="container-page flex flex-col gap-1 py-4">
        <NuxtLink
          v-for="link in items"
          :key="link.to"
          :to="link.to"
          class="flex h-12 items-center rounded-lg px-3 text-[15px] text-fg-muted no-underline hover:bg-ink-880 hover:text-fg"
        >
          {{ link.label }}
        </NuxtLink>

        <div class="mt-3 flex items-center gap-3">
          <LangSwitch />
          <ButtonLink
            :to="links.installation"
            class="flex-1"
          >
            {{ t('landing.nav.start') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </header>
</template>

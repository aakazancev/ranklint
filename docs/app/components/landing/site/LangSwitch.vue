<script setup lang="ts">
import { computed } from 'vue'

const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const options = computed(() => locales.value)
</script>

<template>
  <div
    role="group"
    :aria-label="t('landing.nav.lang')"
    class="flex h-11 items-center gap-0.5 rounded-xl border border-line bg-ink-880 p-[3px]"
  >
    <NuxtLink
      v-for="option in options"
      :key="option.code"
      :to="switchLocalePath(option.code)"
      :aria-current="option.code === locale ? 'true' : undefined"
      :title="option.name"
      class="flex h-9 items-center rounded-[9px] px-3.5 font-mono text-[12.5px] font-bold tracking-wide no-underline transition-colors"
      :class="option.code === locale ? 'bg-ink-750 text-fg' : 'text-fg-dim hover:text-fg-muted'"
    >
      {{ option.code.toUpperCase() }}
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const { locale } = useDocusI18n()

const labels = {
  en: { docs: 'Docs', rules: 'Rules', cli: 'CLI', cta: 'Get started' },
  ru: { docs: 'Дока', rules: 'Правила', cli: 'CLI', cta: 'Начать' },
}

const text = computed(() => labels[locale.value === 'ru' ? 'ru' : 'en'])
const prefix = computed(() => `/${locale.value}`)

const links = computed(() => [
  { label: text.value.docs, to: `${prefix.value}/getting-started/introduction` },
  { label: text.value.rules, to: `${prefix.value}/rules` },
  { label: text.value.cli, to: `${prefix.value}/cli/audit` },
])
</script>

<template>
  <div class="flex items-center gap-1">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      class="hidden shrink-0 rounded-md px-2 py-1.5 text-sm whitespace-nowrap text-muted transition-colors hover:text-highlighted lg:block xl:px-2.5"
    >
      {{ link.label }}
    </NuxtLink>

    <UButton
      color="primary"
      size="sm"
      :to="`${prefix}/getting-started/installation`"
      :ui="{ base: 'rounded-xl' }"
      class="landing-cta ml-1 hidden shrink-0 whitespace-nowrap lg:inline-flex"
    >
      {{ text.cta }}
    </UButton>
  </div>
</template>

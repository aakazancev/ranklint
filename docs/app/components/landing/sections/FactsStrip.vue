<script setup lang="ts">
import rulesIndex from '~~/rules-index.json'

const { t } = useI18n()

const facts = [
  { value: String(rulesIndex.total), label: 'landing.facts.rules' },
  { value: '< 1 KB', label: 'landing.facts.runtime' },
  { value: '6', label: 'landing.facts.formats' },
  { value: 'MIT', label: 'landing.facts.license' },
]
</script>

<template>
  <section class="border-y border-line-soft">
    <div class="container-page">
      <dl class="grid grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(fact, i) in facts"
          :key="fact.label"
          class="flex flex-col gap-1.5 border-line-soft px-2 py-6 sm:px-8"
          :class="[
            i % 2 === 0 ? 'border-r' : '',
            i < 2 ? 'border-b lg:border-b-0' : '',
            'lg:border-r lg:last:border-r-0',
          ]"
        >
          <dt class="font-display text-2xl font-semibold tracking-[-0.02em] text-fg">
            {{ fact.value }}
          </dt>
          <dd class="text-sm text-fg-dim">
            {{ t(fact.label) }}
          </dd>
        </div>
      </dl>
    </div>
  </section>
</template>

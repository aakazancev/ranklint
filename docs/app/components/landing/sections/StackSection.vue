<script setup lang="ts">
const { t } = useI18n()

const zones = [
  { key: 'root', path: '/' },
  { key: 'docs', path: '/docs' },
  { key: 'app', path: '/app' },
]
</script>

<template>
  <SectionShell>
    <div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
      <div class="flex flex-col gap-4.5 rounded-2xl border border-line bg-ink-900 p-7 lg:col-span-6">
        <span class="font-mono text-[11.5px] uppercase tracking-[0.1em] text-fg-faint">
          {{ t('landing.stack.zonesLabel') }}
        </span>

        <ul class="flex list-none flex-col gap-3 p-0">
          <li
            v-for="zone in zones"
            :key="zone.key"
            class="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line bg-ink-850 px-4.5 py-4"
          >
            <span class="w-24 shrink-0 font-mono text-[13.5px] text-acid">{{ zone.path }}</span>
            <span class="grow text-sm text-fg-soft">{{ t(`landing.stack.zones.${zone.key}`) }}</span>
            <span class="font-mono text-xs text-fg-dim">{{ t(`landing.stack.zones.${zone.key}Owner`) }}</span>
          </li>
        </ul>

        <p class="text-sm leading-relaxed text-fg-dim">
          {{ t('landing.stack.zonesNote') }}
        </p>
      </div>

      <div class="flex flex-col gap-5 lg:col-span-5 lg:col-start-8">
        <SectionHeading
          :eyebrow="t('landing.stack.eyebrow')"
          :title="t('landing.stack.title')"
        >
          <template #lead>
            {{ t('landing.stack.lead') }}
          </template>
        </SectionHeading>

        <ul class="flex list-none flex-col gap-3 p-0">
          <CheckItem>{{ t('landing.stack.b1') }}</CheckItem>
          <CheckItem>{{ t('landing.stack.b2') }}</CheckItem>
          <CheckItem>{{ t('landing.stack.b3') }}</CheckItem>
          <CheckItem>{{ t('landing.stack.b4') }}</CheckItem>
        </ul>
      </div>
    </div>
  </SectionShell>
</template>

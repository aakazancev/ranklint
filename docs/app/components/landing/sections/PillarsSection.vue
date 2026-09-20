<script setup lang="ts">
const { t } = useI18n()

const pillars = [
  { key: 'module', icon: 'cube', tags: ['useJsonLd', 'useRanklintIgnore'] },
  { key: 'devtools', icon: 'panel', tags: [] },
  { key: 'cli', icon: 'chevrons', tags: ['audit', 'diff', 'watch'] },
] as const
</script>

<template>
  <SectionShell>
    <SectionHeading
      :eyebrow="t('landing.pillars.eyebrow')"
      :title="t('landing.pillars.title')"
    >
      <template #lead>
        {{ t('landing.pillars.lead') }}
      </template>
    </SectionHeading>

    <div class="mt-12 grid gap-5 md:grid-cols-3">
      <article
        v-for="p in pillars"
        :key="p.key"
        class="flex flex-col gap-4 rounded-2xl border border-line bg-ink-880 p-7"
      >
        <div class="flex size-11 items-center justify-center rounded-xl border border-acid-line bg-acid/[8%] text-acid">
          <IconSet :name="p.icon" />
        </div>

        <h3 class="text-xl font-semibold tracking-[-0.01em] text-fg">
          {{ t(`landing.pillars.${p.key}.title`) }}
        </h3>

        <p class="text-[15.5px] leading-relaxed text-fg-muted">
          {{ t(`landing.pillars.${p.key}.text`) }}
        </p>

        <div
          v-if="p.key === 'devtools'"
          class="mt-auto flex flex-wrap gap-2 pt-1"
        >
          <CodeChip variant="boxed">
            {{ t('landing.pillars.devtools.tagLive') }}
          </CodeChip>
          <CodeChip variant="boxed">
            {{ t('landing.pillars.devtools.tagTheme') }}
          </CodeChip>
        </div>
        <div
          v-else
          class="mt-auto flex flex-wrap gap-2 pt-1"
        >
          <CodeChip
            v-for="tag in p.tags"
            :key="tag"
            variant="boxed"
          >
            {{ tag }}
          </CodeChip>
        </div>
      </article>
    </div>
  </SectionShell>
</template>

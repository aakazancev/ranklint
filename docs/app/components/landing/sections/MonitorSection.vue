<script setup lang="ts">
const { t } = useI18n()

const cards = ['crux', 'gsc', 'alerts'] as const
</script>

<template>
  <SectionShell id="monitor">
    <SectionHeading
      :eyebrow="t('landing.monitor.eyebrow')"
      :title="t('landing.monitor.title')"
    >
      <template #lead>
        {{ t('landing.monitor.leadPre') }} <CodeChip>ranklint audit --url https://prod --mode monitor</CodeChip> {{ t('landing.monitor.leadPost') }}
      </template>
    </SectionHeading>

    <div class="mt-10 grid gap-5 md:grid-cols-3">
      <article
        v-for="card in cards"
        :key="card"
        class="flex flex-col gap-3 rounded-2xl border border-line bg-ink-880 p-6.5"
      >
        <h3 class="text-lg font-semibold text-fg">
          {{ t(`landing.monitor.${card}.title`) }}
        </h3>
        <p class="text-[15px] leading-relaxed text-fg-muted">
          {{ t(`landing.monitor.${card}.text`) }}
        </p>

        <div
          v-if="card === 'crux'"
          class="mt-auto flex gap-2 pt-1"
        >
          <CodeChip
            v-for="m in ['LCP', 'CLS', 'INP']"
            :key="m"
            variant="boxed"
          >
            {{ m }}
          </CodeChip>
        </div>
      </article>
    </div>
  </SectionShell>
</template>

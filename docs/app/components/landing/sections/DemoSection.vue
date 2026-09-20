<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { DEMO_SAMPLE } from '~/utils/demo'

const { t } = useI18n()

const DemoPanel = defineAsyncComponent(() => import('../DemoPanel.vue'))
</script>

<template>
  <SectionShell>
    <SectionHeading
      :eyebrow="t('landing.demo.eyebrow')"
      :title="t('landing.demo.title')"
    >
      <template #lead>
        {{ t('landing.demo.lead') }}
      </template>
    </SectionHeading>

    <div class="mt-11 overflow-hidden rounded-2xl border border-line bg-ink-900">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-ink-850 px-5 py-4">
        <span class="font-mono text-xs uppercase tracking-[0.1em] text-fg-dim">{{ t('landing.demo.inputLabel') }}</span>
        <span class="font-mono text-xs text-fg-dim">level 1</span>
      </div>

      <div class="p-5">
        <ClientOnly>
          <DemoPanel :sample="DEMO_SAMPLE" />

          <template #fallback>
            <div>
              <pre class="h-[11.5rem] overflow-hidden rounded-xl border border-line bg-ink-850 p-4 font-mono text-[12.5px] leading-relaxed text-fg-soft">{{ DEMO_SAMPLE }}</pre>
              <div class="mt-4 flex min-h-[18rem] flex-col gap-2">
                <div
                  v-for="n in 4"
                  :key="n"
                  class="h-14 animate-pulse rounded-xl bg-ink-850"
                />
              </div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </SectionShell>
</template>

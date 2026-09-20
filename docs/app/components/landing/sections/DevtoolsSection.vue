<script setup lang="ts">
import rulesIndex from '~~/rules-index.json'
import { LEVEL1_COUNT } from '~/utils/lint-html'

const { t } = useI18n()
const links = useLandingLinks()
</script>

<template>
  <SectionShell>
    <div class="grid items-center gap-12 lg:grid-cols-12 lg:gap-6">
      <div class="flex flex-col gap-5 lg:col-span-5">
        <SectionHeading
          :eyebrow="t('landing.devtools.eyebrow')"
          :title="t('landing.devtools.title')"
        >
          <template #lead>
            {{ t('landing.devtools.lead') }}
          </template>
        </SectionHeading>

        <ul class="mt-2 flex list-none flex-col gap-3 p-0">
          <CheckItem>{{ t('landing.devtools.b1') }}</CheckItem>
          <CheckItem>{{ t('landing.devtools.b2', { count: LEVEL1_COUNT, total: rulesIndex.total }) }}</CheckItem>
          <CheckItem>{{ t('landing.devtools.b3') }}</CheckItem>
        </ul>

        <NuxtLink
          :to="links.devtools"
          class="mt-2 inline-flex items-center gap-2 text-base font-semibold text-acid no-underline hover:text-acid-bright"
        >
          {{ t('landing.devtools.cta') }}
          <IconSet name="arrow" />
        </NuxtLink>
      </div>

      <div class="overflow-hidden rounded-2xl border border-line bg-ink-900 lg:col-span-6 lg:col-start-7">
        <div class="flex h-12 items-center gap-6 overflow-x-auto border-b border-line-soft bg-ink-850 px-5">
          <span class="flex h-12 shrink-0 items-center border-b-2 border-acid text-[13.5px] font-semibold text-fg">
            SEO
          </span>
          <span
            v-for="tab in ['Pages', 'Components', 'Payload']"
            :key="tab"
            class="shrink-0 text-[13.5px] text-fg-faint"
          >
            {{ tab }}
          </span>
          <span class="ml-auto shrink-0 font-mono text-xs text-fg-dim">{{ t('landing.devtools.panel.route') }}</span>
        </div>

        <div class="p-5">
          <div class="flex flex-wrap gap-2.5 pb-3.5">
            <SeverityBadge
              level="warn"
              variant="chip"
              :count="1"
            />
          </div>

          <div class="flex items-start gap-3 border-t border-line-soft py-3.5">
            <span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-sev-warn" />
            <div class="flex min-w-0 flex-col gap-1">
              <span class="font-mono text-[13px] text-fg">headings:hierarchy</span>
              <span class="text-[13px] text-fg-dim">{{ t('landing.devtools.panel.hierarchy') }}</span>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-2.5 rounded-xl bg-ink-850 p-4">
            <span class="font-mono text-[11.5px] uppercase tracking-[0.1em] text-fg-faint">
              {{ t('landing.devtools.panel.treeLabel') }}
            </span>

            <div class="flex flex-col gap-1.5 font-mono text-[12.5px]">
              <div class="flex gap-2.5">
                <span class="text-acid">h1</span><span class="text-fg-soft">{{ t('landing.devtools.panel.t1') }}</span>
              </div>
              <div class="flex flex-wrap gap-2.5 pl-9">
                <span class="text-sev-warn-fg">h3</span>
                <span class="text-fg-dim">{{ t('landing.devtools.panel.t2') }}</span>
                <span class="text-sev-warn-fg">{{ t('landing.devtools.panel.t2note') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SectionShell>
</template>

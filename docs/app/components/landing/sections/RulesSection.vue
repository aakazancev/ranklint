<script setup lang="ts">
import { computed } from 'vue'
import rulesIndex from '~~/rules-index.json'

const { t, locale } = useI18n()
const links = useLandingLinks()

const categories = computed(() => rulesIndex.groups.map(group => ({
  folder: group.folder,
  count: group.count,
  name: group.title[locale.value === 'ru' ? 'ru' : 'en'],
  to: links.value.rulePath(group.first),
})))
</script>

<template>
  <SectionShell id="rules">
    <div class="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
      <SectionHeading
        :eyebrow="t('landing.rules.eyebrow')"
        :title="t('landing.rules.title', { total: rulesIndex.total, groups: rulesIndex.groups.length })"
      >
        <template #lead>
          {{ t('landing.rules.leadPre') }}
          <SeverityBadge level="error" />,
          <SeverityBadge level="warn" />,
          <SeverityBadge level="info" />
          <span class="text-fg-muted">/</span>
          <SeverityBadge level="off" />.
          {{ t('landing.rules.leadPost') }}
        </template>
      </SectionHeading>

      <ButtonLink
        :to="links.rules"
        variant="ghost"
        class="shrink-0"
      >
        {{ t('landing.rules.cta') }}
        <IconSet name="arrow" />
      </ButtonLink>
    </div>

    <ul class="mt-11 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="cat in categories"
        :key="cat.folder"
      >
        <NuxtLink
          :to="cat.to"
          class="flex h-full flex-col gap-2.5 rounded-2xl border border-line bg-ink-880 p-5.5 no-underline transition-colors hover:border-line-strong"
        >
          <span class="flex items-center justify-between gap-3">
            <span class="text-[17px] font-semibold text-fg">{{ cat.name }}</span>
            <span class="font-mono text-[13px] text-acid">{{ cat.count }}</span>
          </span>
          <span class="text-sm leading-snug text-fg-dim">{{ t(`landing.rules.cat.${cat.folder}`) }}</span>
        </NuxtLink>
      </li>
    </ul>

    <div class="mt-4 overflow-hidden rounded-2xl border border-line bg-ink-900">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-ink-850 px-5 py-4">
        <span class="font-mono text-xs uppercase tracking-[0.1em] text-fg-dim">ranklint.config.ts</span>
        <span class="text-[13px] text-fg-dim">{{ t('landing.rules.configNote') }}</span>
      </div>

      <div class="overflow-x-auto">
        <pre class="min-w-[32rem] px-5 py-5 font-mono text-[13.5px] leading-normal"><code><span class="text-[#C792EA]">export default</span> <span class="text-fg-soft">defineRanklintConfig({</span>
  <span class="text-sev-info-fg">rules</span><span class="text-fg-soft">: {</span>
    <span class="text-fg-soft">'canonical:required'</span><span class="text-fg-faint">: </span><span class="text-sev-error-fg">'error'</span><span class="text-fg-faint">,</span>
    <span class="text-fg-soft">'http:ttfb-budget'</span><span class="text-fg-faint">: </span><span class="text-fg-soft">[</span><span class="text-sev-warn-fg">'warn'</span><span class="text-fg-faint">, { </span><span class="text-sev-info-fg">p75</span><span class="text-fg-faint">: </span><span class="text-acid">600</span><span class="text-fg-faint"> }</span><span class="text-fg-soft">]</span><span class="text-fg-faint">,</span>
    <span class="text-fg-soft">'images:no-lazy-above-fold'</span><span class="text-fg-faint">: </span><span class="text-fg-dim">'off'</span><span class="text-fg-faint">,</span>
  <span class="text-fg-soft">},</span>
<span class="text-fg-soft">})</span></code></pre>
      </div>
    </div>
  </SectionShell>
</template>

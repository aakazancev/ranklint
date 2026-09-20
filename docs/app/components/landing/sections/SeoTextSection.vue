<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()
const links = useLandingLinks()

const blocks = computed(() => [
  { key: 'ci', to: links.value.diff },
  { key: 'regressions', to: links.value.config },
  { key: 'module', to: links.value.module },
  { key: 'stack', to: links.value.audit },
])
</script>

<template>
  <SectionShell>
    <SectionHeading
      :eyebrow="t('landing.seotext.eyebrow')"
      :title="t('landing.seotext.title')"
    >
      <template #lead>
        {{ t('landing.seotext.lead') }}
      </template>
    </SectionHeading>

    <div class="mt-10 flex max-w-[65ch] flex-col gap-10">
      <template
        v-for="(block, index) in blocks"
        :key="block.key"
      >
        <div class="flex flex-col gap-3">
          <h3 class="text-xl font-semibold tracking-[-0.01em] text-fg">
            {{ t(`landing.seotext.${block.key}.title`) }}
          </h3>
          <p class="text-[15.5px] leading-relaxed text-fg-muted text-pretty">
            {{ t(`landing.seotext.${block.key}.text`) }}
          </p>
          <NuxtLink
            :to="block.to"
            class="inline-flex items-center gap-2 text-[15px] font-semibold text-acid no-underline hover:text-acid-bright"
          >
            {{ t(`landing.seotext.${block.key}.link`) }}
            <IconSet name="arrow" />
          </NuxtLink>
        </div>

        <blockquote
          v-if="index === 1"
          class="border-l-2 border-acid-line pl-5 text-[17px] leading-relaxed text-fg-soft"
        >
          {{ t('landing.seotext.quote') }}
        </blockquote>
      </template>
    </div>
  </SectionShell>
</template>

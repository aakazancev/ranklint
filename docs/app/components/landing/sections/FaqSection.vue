<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()
const links = useLandingLinks()

const items = [
  { key: 'lighthouse', kind: 'plain' },
  { key: 'nuxtseo', kind: 'emphasis' },
  { key: 'nonnuxt', kind: 'plain' },
  { key: 'pipeline', kind: 'inline', code: 'ranklint diff' },
  { key: 'ignore', kind: 'inline', code: 'useRanklintIgnore' },
  { key: 'playwright', kind: 'plain' },
] as const

const plainAnswer = (key: string, kind: string, code?: string) => kind === 'plain'
  ? t(`landing.faq.${key}.a`)
  : kind === 'inline'
    ? `${t(`landing.faq.${key}.aPre`)} ${code} ${t(`landing.faq.${key}.aPost`)}`
    : [
        t('landing.faq.nuxtseo.aPre'),
        t('landing.faq.nuxtseo.aEmph1'),
        t('landing.faq.nuxtseo.aMid'),
        t('landing.faq.nuxtseo.aEmph2'),
        t('landing.faq.nuxtseo.aPost'),
      ].join(' ')

const questions = computed(() => [
  ...items.map(item => ({
    q: t(`landing.faq.${item.key}.q`),
    a: plainAnswer(item.key, item.kind, 'code' in item ? item.code : undefined),
  })),
  { q: t('landing.faq.price.q'), a: t('landing.faq.price.a') },
])

useJsonLd('FAQPage', {
  mainEntity: questions.value.map(item => ({
    '@type': 'Question',
    'name': item.q,
    'acceptedAnswer': { '@type': 'Answer', 'text': item.a },
  })),
})
</script>

<template>
  <SectionShell>
    <SectionHeading
      :eyebrow="t('landing.faq.eyebrow')"
      :title="t('landing.faq.title')"
    />

    <dl class="mt-10 grid gap-3 lg:grid-cols-2">
      <div
        v-for="item in items"
        :key="item.key"
        class="flex flex-col gap-2.5 rounded-2xl border border-line bg-ink-880 p-6"
      >
        <dt class="text-[16.5px] font-semibold text-fg">
          {{ t(`landing.faq.${item.key}.q`) }}
        </dt>

        <dd class="text-[15px] leading-relaxed text-fg-muted">
          <template v-if="item.kind === 'plain'">
            {{ t(`landing.faq.${item.key}.a`) }}
          </template>

          <template v-else-if="item.kind === 'inline'">
            {{ t(`landing.faq.${item.key}.aPre`) }} <CodeChip>{{ item.code }}</CodeChip> {{ t(`landing.faq.${item.key}.aPost`) }}
          </template>

          <template v-else>
            {{ t('landing.faq.nuxtseo.aPre') }}
            <strong class="font-semibold text-fg-soft">{{ t('landing.faq.nuxtseo.aEmph1') }}</strong>
            {{ t('landing.faq.nuxtseo.aMid') }}
            <strong class="font-semibold text-fg-soft">{{ t('landing.faq.nuxtseo.aEmph2') }}</strong>
            {{ t('landing.faq.nuxtseo.aPost') }}
          </template>
        </dd>
      </div>

      <div
        class="flex flex-col items-start justify-between gap-5 rounded-2xl border border-line bg-ink-880 p-6 sm:flex-row sm:items-center lg:col-span-2"
      >
        <div class="flex flex-col gap-2">
          <dt class="text-[16.5px] font-semibold text-fg">
            {{ t('landing.faq.price.q') }}
          </dt>
          <dd class="text-[15px] leading-relaxed text-fg-muted">
            {{ t('landing.faq.price.a') }}
          </dd>
        </div>

        <ButtonLink
          :to="links.repo"
          external
          variant="ghost"
          class="shrink-0"
        >
          {{ t('landing.faq.price.cta') }}
        </ButtonLink>
      </div>
    </dl>
  </SectionShell>
</template>

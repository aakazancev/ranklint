<script setup lang="ts">
const { t } = useI18n()
const links = useLandingLinks()
</script>

<template>
  <SectionShell>
    <div
      class="flex flex-col items-center gap-6 rounded-3xl border border-acid-line bg-[#0D1009] bg-[radial-gradient(700px_300px_at_50%_0%,rgba(180,241,60,0.12),rgba(13,16,9,0)_72%)] px-6 py-14 sm:px-12 sm:py-16"
    >
      <h2
        class="max-w-3xl text-center font-display text-[clamp(1.75rem,4vw,2.5rem)] font-semibold leading-[1.12] tracking-[-0.03em] text-fg text-balance"
      >
        {{ t('landing.cta.title') }}
      </h2>

      <p class="max-w-xl text-center text-[17px] leading-relaxed text-fg-muted text-pretty">
        {{ t('landing.cta.lead') }}
      </p>

      <div class="mt-2 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center">
        <ButtonLink
          :to="links.introduction"
          size="lg"
        >
          {{ t('landing.cta.primary') }}
        </ButtonLink>
        <ButtonLink
          :to="links.repo"
          external
          variant="ghost"
          size="lg"
        >
          <IconSet name="github" />
          {{ t('landing.cta.secondary') }}
        </ButtonLink>
      </div>
    </div>
  </SectionShell>
</template>

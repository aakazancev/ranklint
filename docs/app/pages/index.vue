<script setup lang="ts">
const { t } = useI18n()

definePageMeta({ header: false })

const title = computed(() => t('landing.meta.title'))
const description = computed(() => t('landing.meta.description'))

useSeo({ title, description, type: 'website' })

defineOgImage('Landing', {
  title: title.value.slice(0, 60),
  description: formatOgDescription(title.value, description.value),
})
</script>

<template>
  <div class="rl-landing min-h-screen">
    <TheHeader />

    <main id="content">
      <HeroSection />
      <FactsStrip />
      <PillarsSection />
      <DemoSection />
      <DevtoolsSection />
      <RulesSection />
      <CiSection />
      <StackSection />
      <MonitorSection />
      <SeoTextSection />
      <FaqSection />
      <CtaSection />
    </main>
  </div>
</template>

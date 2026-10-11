<script setup lang="ts">
const { t } = useI18n()
const links = useLandingLinks()

const bullets = ['b1', 'b2', 'b3', 'b4'] as const
const flags = ['--logo', '--brand-name', '--accent', '--run-url']
</script>

<template>
  <SectionShell id="dashboard">
    <SectionHeading
      :eyebrow="t('landing.dashboard.eyebrow')"
      :title="t('landing.dashboard.title')"
    >
      <template #lead>
        {{ t('landing.dashboard.lead') }}
      </template>
    </SectionHeading>

    <div class="mt-11 grid gap-5 lg:grid-cols-12 lg:items-start">
      <figure class="m-0 overflow-hidden rounded-2xl border border-line bg-ink-900 lg:col-span-8">
        <figcaption class="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-ink-850 px-5 py-4">
          <span class="text-sm font-semibold text-fg">{{ t('landing.dashboard.frameTitle') }}</span>
          <span class="font-mono text-xs text-fg-dim">example.com</span>
        </figcaption>
        <picture>
          <source
            media="(max-width: 639px)"
            srcset="/dashboard/dashboard-393.webp"
            width="786"
            height="1280"
          >
          <img
            src="/dashboard/dashboard-1440.webp"
            :alt="t('landing.dashboard.alt')"
            width="1440"
            height="900"
            loading="lazy"
            decoding="async"
            class="block h-auto w-full"
          >
        </picture>
      </figure>

      <div class="flex min-w-0 flex-col gap-4 lg:col-span-4">
        <div class="flex flex-col gap-3.5 rounded-2xl border border-line bg-ink-880 p-6">
          <h3 class="text-[17px] font-semibold text-fg">
            {{ t('landing.dashboard.insideTitle') }}
          </h3>
          <ul class="m-0 flex list-none flex-col gap-3 p-0">
            <CheckItem
              v-for="b in bullets"
              :key="b"
            >
              {{ t(`landing.dashboard.${b}`) }}
            </CheckItem>
          </ul>
        </div>

        <div class="flex flex-col gap-3 rounded-2xl border border-line bg-ink-880 p-6">
          <h3 class="text-[17px] font-semibold text-fg">
            {{ t('landing.dashboard.brandTitle') }}
          </h3>
          <pre class="overflow-x-auto font-mono text-[13px] leading-relaxed"><code><span class="text-fg-faint">$ </span><span class="text-fg-soft">ranklint dashboard \
  --dir .ranklint/reports --out public</span></code></pre>
          <div class="flex flex-wrap gap-2">
            <CodeChip
              v-for="f in flags"
              :key="f"
              variant="boxed"
            >
              {{ f }}
            </CodeChip>
          </div>
          <p class="text-sm leading-relaxed text-fg-dim">
            {{ t('landing.dashboard.brandNote') }}
          </p>
          <NuxtLink
            :to="links.monitor"
            class="mt-1 inline-flex items-center gap-2 text-base font-semibold text-acid no-underline hover:text-acid-bright"
          >
            {{ t('landing.dashboard.cta') }}
            <IconSet name="arrow" />
          </NuxtLink>
        </div>
      </div>
    </div>
  </SectionShell>
</template>

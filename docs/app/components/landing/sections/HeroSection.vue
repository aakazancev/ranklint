<script setup lang="ts">
import { ref } from 'vue'
import rulesIndex from '~~/rules-index.json'
import type { Level } from '~/utils/severity'

const { t } = useI18n()
const links = useLandingLinks()

const command = 'npx nuxi module add @ranklint/nuxt'
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(command)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copied.value = false
  }
}

const findings: { level: Level, rule: string, url: string, message: string }[] = [
  { level: 'error', rule: 'meta:title-required', url: '/bugs/title-missing', message: 'Page has no <title>' },
  { level: 'error', rule: 'meta:description-required', url: '/bugs/description-missing', message: 'Page has no meta description' },
  { level: 'error', rule: 'headings:single-h1', url: '/bugs/h1-multiple', message: 'Page has 2 <h1> elements, expected exactly 1' },
  { level: 'warn', rule: 'images:alt-required', url: '/bugs/images-bad', message: 'Image has no alt attribute' },
  { level: 'warn', rule: 'images:dimensions-required', url: '/bugs/images-bad', message: 'Image has no explicit width/height' },
  { level: 'warn', rule: 'images:no-lazy-above-fold', url: '/bugs/images-bad', message: 'Image in the viewport uses loading="lazy"' },
]
</script>

<template>
  <section
    id="top"
    class="relative bg-[radial-gradient(900px_420px_at_50%_-80px,rgba(180,241,60,0.10),rgba(10,11,13,0)_70%)] pb-20 pt-14 sm:pt-20 lg:pb-24"
  >
    <div class="container-page flex flex-col items-center">
      <span
        class="inline-flex h-8.5 items-center gap-2.5 rounded-full border border-acid-line bg-acid/[7%] px-4 font-mono text-xs uppercase tracking-[0.1em] text-acid"
      >
        <span class="size-1.5 rounded-full bg-acid" />
        {{ t('landing.hero.badge') }}
      </span>

      <h1
        class="mt-7 max-w-5xl text-center font-display text-[clamp(2.25rem,6.2vw,4.125rem)] font-semibold leading-[1.06] tracking-[-0.035em] text-fg text-balance"
      >
        {{ t('landing.hero.titlePre') }}
        <span class="text-acid">{{ t('landing.hero.titleAccent') }}</span>{{ t('landing.hero.titlePost') }}
      </h1>

      <p class="mt-6 max-w-2xl text-center text-[17px] leading-relaxed text-fg-muted text-pretty sm:text-[19px]">
        {{ t('landing.hero.lead') }}
      </p>

      <div class="mt-9 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center">
        <ButtonLink
          :to="links.installation"
          size="lg"
        >
          {{ t('landing.hero.ctaPrimary') }}
        </ButtonLink>
        <ButtonLink
          :to="links.rules"
          variant="ghost"
          size="lg"
        >
          {{ t('landing.hero.ctaSecondary', { total: rulesIndex.total }) }}
          <IconSet name="arrow" />
        </ButtonLink>
      </div>

      <div class="mt-8 flex h-12 max-w-full items-center gap-3.5 rounded-xl border border-line bg-ink-880 pl-4.5 pr-2">
        <span class="font-mono text-sm text-fg-faint">$</span>
        <span class="truncate font-mono text-sm text-fg-soft">{{ command }}</span>
        <button
          type="button"
          class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-ink-800 text-fg-muted transition-colors hover:text-fg"
          :aria-label="copied ? t('landing.hero.copied') : t('landing.hero.copyCommand')"
          @click="copy"
        >
          <IconSet name="copy" />
        </button>
      </div>

      <TerminalWindow
        class="mt-14 w-full max-w-5xl"
        :title="t('landing.hero.term.context')"
      >
        <div class="flex flex-col gap-1.5">
          <div class="flex gap-2.5">
            <span class="text-fg-faint">$</span>
            <span class="text-fg-soft">ranklint audit --url http://localhost:3000 --reporter json --output report.json</span>
          </div>
          <p class="text-fg-dim">
            {{ t('landing.hero.term.crawl') }}
          </p>
          <div class="mt-2 flex gap-2.5">
            <span class="text-fg-faint">$</span>
            <span class="text-fg-soft">ranklint diff --base main --current report.json --reporter markdown</span>
          </div>

          <div class="mt-3 flex flex-col gap-1.5">
            <div
              v-for="f in findings"
              :key="`${f.rule}-${f.url}`"
              class="flex items-baseline gap-3"
            >
              <SeverityBadge
                :level="f.level"
                class="w-14 shrink-0"
              />
              <span class="w-60 shrink-0 text-fg">{{ f.rule }}</span>
              <span class="text-fg-dim">{{ f.url }} — {{ f.message }}</span>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap items-center gap-3.5 border-t border-dashed border-line pt-3.5">
            <span class="text-fg-dim">{{ t('landing.hero.term.summary') }}</span>
            <span class="inline-flex h-6.5 items-center rounded-md bg-sev-error/[12%] px-3 text-[12.5px] font-bold text-sev-error-fg">
              {{ t('landing.hero.term.exit') }}
            </span>
          </div>
        </div>
      </TerminalWindow>
    </div>
  </section>
</template>

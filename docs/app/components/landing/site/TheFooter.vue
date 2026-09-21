<script setup lang="ts">
import { computed } from 'vue'

const { t } = useI18n()
const links = useLandingLinks()

const columns = computed(() => [
  {
    key: 'docs',
    items: [
      { key: 'intro', to: links.value.introduction, external: false },
      { key: 'install', to: links.value.installation, external: false },
      { key: 'module', to: links.value.module, external: false },
      { key: 'guide', to: links.value.guide, external: false },
      { key: 'changelog', to: links.value.changelog, external: false },
    ],
  },
  {
    key: 'cli',
    items: [
      { key: 'audit', to: links.value.audit, external: false },
      { key: 'diff', to: links.value.diff, external: false },
      { key: 'monitor', to: links.value.monitor, external: false },
    ],
  },
  {
    key: 'rules',
    items: [
      { key: 'all', to: links.value.rules, external: false },
      { key: 'config', to: links.value.config, external: false },
      { key: 'custom', to: links.value.customRules, external: false },
    ],
  },
  {
    key: 'gh',
    items: [
      { key: 'releases', to: links.value.releases, external: true },
      { key: 'license', to: links.value.license, external: true },
      { key: 'issues', to: links.value.issues, external: true },
    ],
  },
])

const year = new Date().getFullYear()
</script>

<template>
  <footer class="rl-landing border-t border-line-soft">
    <div class="container-page pb-10 pt-14">
      <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)] lg:gap-6">
        <div class="flex flex-col gap-3.5 lg:pr-12">
          <SiteWordmark size="text-base" />
          <p class="text-sm leading-relaxed text-fg-dim">
            {{ t('landing.footer.tagline') }}
          </p>
        </div>

        <nav
          v-for="col in columns"
          :key="col.key"
          class="flex flex-col gap-3"
        >
          <h2 class="text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-dim">
            {{ t(`landing.footer.${col.key}.title`) }}
          </h2>
          <template
            v-for="item in col.items"
            :key="item.key"
          >
            <a
              v-if="item.external"
              :href="item.to"
              rel="noopener"
              class="text-[14.5px] text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {{ t(`landing.footer.${col.key}.${item.key}`) }}
            </a>
            <NuxtLink
              v-else
              :to="item.to"
              class="text-[14.5px] text-fg-muted no-underline transition-colors hover:text-fg"
            >
              {{ t(`landing.footer.${col.key}.${item.key}`) }}
            </NuxtLink>
          </template>
        </nav>
      </div>

      <div class="mt-11 flex flex-wrap items-center justify-between gap-4 border-t border-line-soft pt-6">
        <span class="text-[13.5px] text-fg-faint">{{ t('landing.footer.copyright', { year }) }}</span>
        <LangSwitch />
      </div>
    </div>
  </footer>
</template>

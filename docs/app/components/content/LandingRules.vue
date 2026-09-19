<script setup lang="ts">
import rulesIndex from '~~/rules-index.json'

defineProps<{ countLabel: string, allLabel: string }>()

const { locale } = useDocusI18n()
const { el, value } = useCountUp(rulesIndex.total)

function groupTitle(title: { en: string, ru: string }) {
  return title[locale.value === 'ru' ? 'ru' : 'en']
}

function rulePath(folder: string, id: string) {
  return `/${locale.value}/rules/${folder}/${id.replace(/:/g, '-')}`
}
</script>

<template>
  <section class="mt-16 bg-neutral-950 text-neutral-100 lg:mt-24 dark:border-y dark:border-white/10 dark:bg-neutral-900">
    <UContainer class="py-16 lg:py-24">
      <div class="max-w-2xl">
        <h2>
          <span
            ref="el"
            class="block font-mono text-7xl leading-none font-semibold tracking-tighter text-white tabular-nums sm:text-8xl"
          >{{ value }} </span>
          <span class="mt-4 block text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            <slot name="title" />
          </span>
        </h2>

        <p class="mt-6 text-neutral-400 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
          <slot name="description" />
        </p>

        <NuxtLink
          :to="`/${locale}/rules`"
          class="landing-cta mt-5 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          {{ allLabel }}
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </NuxtLink>
      </div>

      <div class="mt-12 gap-x-8 sm:columns-2 lg:columns-3 xl:columns-4">
        <div
          v-for="group in rulesIndex.groups"
          :key="group.folder"
          class="mb-7 break-inside-avoid"
        >
          <p class="text-xs font-medium tracking-wide text-neutral-500">
            {{ groupTitle(group.title) }} {{ countLabel.replace('{count}', String(group.count)) }}
          </p>
          <ul class="mt-2 grid gap-1">
            <li
              v-for="id in group.ids"
              :key="id"
            >
              <NuxtLink
                :to="rulePath(group.folder, id)"
                class="font-mono text-[13px] text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-colors hover:text-white hover:decoration-primary"
              >
                {{ id }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </UContainer>
  </section>
</template>

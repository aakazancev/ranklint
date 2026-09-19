<script setup lang="ts">
defineProps<{
  stackTitle: string
  runtimeTitle: string
  devTitle: string
  reportImage: string
  reportImageAlt: string
  reportImageWidth: number
  reportImageHeight: number
  devImageLight: string
  devImageDark: string
  devImageAlt: string
  devImageWidth: number
  devImageHeight: number
}>()

const root = useReveal()
</script>

<template>
  <section
    ref="root"
    class="border-b border-default"
  >
    <UContainer class="py-16 lg:py-24">
      <h2 class="reveal max-w-[28ch] text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        <slot name="title" />
      </h2>

      <div class="mt-10 grid gap-4 lg:grid-cols-3">
        <article class="reveal flex min-w-0 flex-col overflow-hidden rounded-md border border-default bg-default lg:col-span-2 lg:row-span-2">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-highlighted">
              {{ stackTitle }}
            </h3>
            <div class="mt-3 max-w-[60ch] text-sm text-muted [&_a]:text-primary [&_a]:underline-offset-4 [&_li]:mt-2 hover:[&_a]:underline">
              <slot name="stack" />
            </div>
          </div>
          <div class="landing-bleed mt-auto mx-6 mb-6 overflow-hidden rounded-md border border-default">
            <img
              :src="reportImage"
              :alt="reportImageAlt"
              :width="reportImageWidth"
              :height="reportImageHeight"
              loading="lazy"
              decoding="async"
              class="block h-auto w-full"
            >
          </div>
        </article>

        <article
          class="reveal min-w-0 rounded-md border border-primary/20 bg-primary/5 p-6"
          style="--reveal-delay: 80ms"
        >
          <h3 class="text-lg font-semibold text-highlighted">
            {{ runtimeTitle }}
          </h3>
          <div class="mt-3 text-sm text-muted">
            <slot name="runtime" />
          </div>
        </article>

        <article
          class="reveal flex min-w-0 flex-col overflow-hidden rounded-md border border-default bg-default"
          style="--reveal-delay: 160ms"
        >
          <div class="p-6 pb-4">
            <h3 class="text-lg font-semibold text-highlighted">
              {{ devTitle }}
            </h3>
            <div class="mt-3 text-sm text-muted">
              <slot name="dev" />
            </div>
          </div>
          <img
            :src="devImageLight"
            :alt="devImageAlt"
            :width="devImageWidth"
            :height="devImageHeight"
            loading="lazy"
            decoding="async"
            class="mt-auto block h-auto w-full border-t border-default dark:hidden"
          >
          <img
            :src="devImageDark"
            :alt="devImageAlt"
            :width="devImageWidth"
            :height="devImageHeight"
            loading="lazy"
            decoding="async"
            class="mt-auto hidden h-auto w-full border-t border-default dark:block"
          >
        </article>
      </div>
    </UContainer>
  </section>
</template>

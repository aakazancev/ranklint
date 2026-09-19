<script setup lang="ts">
import type { DemoLabels } from '~/utils/demo'

defineProps<{ demo: DemoLabels }>()
</script>

<template>
  <section class="overflow-hidden">
    <UContainer class="grid gap-10 pt-10 pb-14 lg:grid-cols-12 lg:gap-12 lg:pt-14 lg:pb-20">
      <div class="lg:col-span-5 lg:pt-8">
        <h1 class="rise pb-1 text-4xl leading-[1.08] font-semibold tracking-tight text-highlighted sm:text-5xl lg:text-[2.75rem] xl:text-5xl">
          <slot name="title" />
        </h1>

        <p
          class="rise mt-6 max-w-[42ch] text-lg text-muted"
          style="--rise-delay: 80ms"
        >
          <slot name="description" />
        </p>

        <div
          class="rise mt-8 flex flex-wrap items-center gap-3"
          style="--rise-delay: 160ms"
        >
          <slot name="actions" />
        </div>
      </div>

      <div
        class="rise min-w-0 lg:col-span-7"
        style="--rise-delay: 240ms"
      >
        <LandingDemo :labels="demo" />
      </div>
    </UContainer>
  </section>
</template>

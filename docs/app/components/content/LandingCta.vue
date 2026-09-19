<script setup lang="ts">
const root = useReveal()
</script>

<template>
  <section
    ref="root"
    class="bg-primary/5"
  >
    <UContainer class="reveal py-20 text-center lg:py-24">
      <p
        class="font-mono text-4xl leading-none font-bold tracking-tight text-highlighted sm:text-5xl"
        aria-hidden="true"
      >
        rank<span class="text-primary">lint</span>
      </p>
      <h2 class="mx-auto mt-8 max-w-[20ch] text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
        <slot name="title" />
      </h2>
      <p class="mx-auto mt-4 max-w-[52ch] text-muted">
        <slot name="description" />
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
        <slot name="actions" />
      </div>
    </UContainer>
  </section>
</template>

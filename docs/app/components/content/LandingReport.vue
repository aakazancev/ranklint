<script setup lang="ts">
defineProps<{ commentTitle: string, caption: string }>()

const root = useReveal()
</script>

<template>
  <section
    ref="root"
    class="border-b border-default"
  >
    <UContainer class="py-16 lg:py-24">
      <div class="reveal max-w-2xl">
        <h2 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          <slot name="title" />
        </h2>
        <div class="mt-4 text-muted [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
          <slot name="description" />
        </div>
      </div>

      <figure class="reveal mt-10">
        <div class="overflow-hidden rounded-md border border-default">
          <div class="flex items-center gap-2 border-b border-default bg-elevated/50 px-4 py-2.5">
            <UIcon
              name="i-lucide-message-square"
              class="size-4 text-dimmed"
            />
            <span class="font-mono text-xs text-muted">{{ commentTitle }}</span>
          </div>
          <div class="overflow-x-auto px-4 py-2 text-sm [&_h2]:mt-4 [&_h2]:text-base [&_h3]:mt-5 [&_h3]:text-sm [&_table]:text-xs">
            <slot name="output" />
          </div>
        </div>
        <figcaption class="mt-3 text-xs text-dimmed">
          {{ caption }}
        </figcaption>
      </figure>
    </UContainer>
  </section>
</template>

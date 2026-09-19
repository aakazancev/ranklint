<script setup lang="ts">
defineProps<{
  steps: { label: string, text: string }[]
  facts: { title: string, text: string }[]
}>()

const root = useReveal()
</script>

<template>
  <section ref="root">
    <UContainer class="py-16 lg:py-20">
      <div class="reveal max-w-2xl">
        <h2 class="text-2xl font-semibold tracking-tight text-highlighted sm:text-3xl">
          <slot name="title" />
        </h2>
        <p class="mt-4 text-muted">
          <slot name="description" />
        </p>
      </div>

      <ol class="reveal mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-3">
        <li
          v-for="(step, index) in steps"
          :key="step.label"
          class="border-t border-primary/40 pt-4"
          :style="`--reveal-delay: ${index * 80}ms`"
        >
          <p class="font-medium text-highlighted">
            {{ step.label }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ step.text }}
          </p>
        </li>
      </ol>

      <div class="reveal mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="fact in facts"
          :key="fact.title"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ fact.title }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ fact.text }}
          </p>
        </div>
      </div>

      <div class="reveal mt-10">
        <slot name="actions" />
      </div>
    </UContainer>
  </section>
</template>

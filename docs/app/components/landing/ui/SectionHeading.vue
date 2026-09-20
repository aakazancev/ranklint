<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow: string
    title?: string
    narrow?: boolean
  }>(),
  { title: undefined, narrow: true },
)
</script>

<template>
  <div
    class="flex flex-col gap-4"
    :class="narrow ? 'max-w-3xl' : ''"
  >
    <span class="font-mono text-xs tracking-[0.14em] uppercase text-acid">
      {{ eyebrow }}
    </span>

    <h2
      class="font-display font-semibold tracking-[-0.03em] text-fg text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.14] text-balance"
    >
      <slot name="title">{{ title }}</slot>
    </h2>

    <p
      v-if="$slots.lead"
      class="text-base sm:text-[17px] leading-relaxed text-fg-muted text-pretty"
    >
      <slot name="lead" />
    </p>
  </div>
</template>

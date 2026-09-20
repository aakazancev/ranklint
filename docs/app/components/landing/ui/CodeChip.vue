<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'soft' | 'boxed' }>(), { variant: 'soft' })
</script>

<template>
  <code
    :class="
      variant === 'boxed'
        ? 'rounded-lg border border-line bg-ink-800 px-3 py-1.5 font-mono text-[12.5px] text-fg-soft'
        : 'font-mono text-[0.92em] text-fg-soft'
    "
  ><slot /></code>
</template>

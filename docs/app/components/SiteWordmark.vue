<script setup lang="ts">
withDefaults(defineProps<{ size?: string }>(), { size: 'text-lg' })
</script>

<template>
  <span
    class="flex items-center font-mono leading-none font-bold tracking-tight text-fg"
    :class="size"
  >
    rank<span class="text-acid">lint</span><span
      class="text-acid"
      aria-hidden="true"
    >▌</span>
  </span>
</template>

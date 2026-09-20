<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
    tight?: boolean
  }>(),
  { id: undefined, tight: false },
)
</script>

<template>
  <section
    :id="id"
    class="scroll-mt-24"
    :class="tight ? 'py-0' : 'py-16 sm:py-20 lg:py-28'"
  >
    <div class="container-page">
      <slot />
    </div>
  </section>
</template>

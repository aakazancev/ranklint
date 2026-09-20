<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    to: string
    variant?: 'primary' | 'ghost'
    size?: 'md' | 'lg'
    external?: boolean
  }>(),
  { variant: 'primary', size: 'md', external: false },
)

const variants = {
  primary: 'bg-acid text-ink-950 hover:bg-acid-bright',
  ghost: 'border border-line-strong bg-ink-880 text-fg hover:border-fg-dim',
}

const sizes = {
  md: 'h-11 px-5.5 text-[15px]',
  lg: 'h-13 px-7 text-base',
}

const classes = computed(() => [
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold no-underline transition-colors',
  variants[props.variant],
  sizes[props.size],
])
</script>

<template>
  <a
    v-if="external"
    :href="to"
    rel="noopener"
    :class="classes"
  >
    <slot />
  </a>
  <NuxtLink
    v-else
    :to="to"
    :class="classes"
  >
    <slot />
  </NuxtLink>
</template>

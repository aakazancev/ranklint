<script setup lang="ts">
import { computed } from 'vue'
import type { Level } from '~/utils/severity'

const props = withDefaults(
  defineProps<{
    level: Level
    variant?: 'chip' | 'plain'
    count?: number | string
  }>(),
  { variant: 'plain', count: undefined },
)

const chip: Record<Level, string> = {
  error: 'bg-sev-error/[12%] text-sev-error-fg',
  warn: 'bg-sev-warn/[12%] text-sev-warn-fg',
  info: 'bg-sev-info/[12%] text-sev-info-fg',
  off: 'bg-ink-800 text-fg-dim',
}

const plain: Record<Level, string> = {
  error: 'text-sev-error-fg',
  warn: 'text-sev-warn-fg',
  info: 'text-sev-info-fg',
  off: 'text-fg-dim',
}

const classes = computed(() =>
  props.variant === 'chip'
    ? `inline-flex items-center h-6.5 px-3 rounded-md text-[12.5px] font-bold ${chip[props.level]}`
    : `font-mono font-bold ${plain[props.level]}`,
)
</script>

<template>
  <span :class="classes">
    <template v-if="count !== undefined">{{ count }} </template>{{ level }}
  </span>
</template>

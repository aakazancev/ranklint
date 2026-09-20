<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ title?: string, description?: string }>()

const LIMIT = 118

const summary = computed(() => {
  const text = props.description ?? ''
  if (text.length <= LIMIT) return text
  const cut = text.slice(0, LIMIT)
  return `${cut.slice(0, cut.lastIndexOf(' '))}...`
})
</script>

<template>
  <div
    class="flex h-full w-full flex-col px-[80px] py-[72px]"
    style="background-color: #0a0b0d; font-family: 'Golos OG'"
  >
    <div
      class="flex items-center"
      style="font-family: 'Mono OG'"
    >
      <span
        class="text-[32px] font-bold tracking-tight"
        style="color: #edeff2"
      >rank</span>
      <span
        class="text-[32px] font-bold tracking-tight"
        style="color: #b4f13c"
      >lint▌</span>
    </div>

    <div
      class="mt-[56px] flex h-[6px] w-[96px]"
      style="background-color: #b4f13c"
    />

    <h1
      v-if="title"
      class="mt-[36px] flex max-w-[940px] text-[76px] leading-[1.12] font-semibold tracking-tight"
      style="font-family: 'Unbounded OG'; color: #edeff2"
    >
      {{ title.slice(0, 64) }}
    </h1>

    <p
      v-if="summary"
      class="mt-[28px] flex max-w-[900px] text-[28px] leading-[1.4]"
      style="color: #a8afb9"
    >
      {{ summary }}
    </p>

    <div class="mt-auto flex">
      <span
        class="text-[24px]"
        style="color: #7c848f"
      >ranklint.dev</span>
    </div>
  </div>
</template>

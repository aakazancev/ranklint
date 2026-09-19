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
class="flex h-full w-full flex-col bg-neutral-950 px-[80px] py-[72px]"
    style="font-family: 'Geist OG'">
    <div class="flex items-center">
      <span class="text-[32px] font-bold tracking-tight text-white">rank</span>
      <span class="text-[32px] font-bold tracking-tight text-emerald-500">lint</span>
    </div>

    <div class="mt-[56px] flex h-[6px] w-[96px] bg-emerald-500" />

    <h1
      v-if="title"
      class="mt-[36px] flex max-w-[940px] text-[76px] leading-[1.12] font-semibold tracking-tight text-white"
    >
      {{ title.slice(0, 64) }}
    </h1>

    <p
      v-if="summary"
      class="mt-[28px] flex max-w-[900px] text-[28px] leading-[1.4] text-neutral-400"
    >
      {{ summary }}
    </p>

    <div class="mt-auto flex">
      <span class="text-[24px] text-neutral-500">ranklint.dev</span>
    </div>
  </div>
</template>

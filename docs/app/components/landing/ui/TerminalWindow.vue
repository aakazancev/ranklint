<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    meta?: string
  }>(),
  { title: undefined, meta: undefined },
)
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-line bg-ink-900 shadow-[0_32px_80px_rgba(0,0,0,0.55)]">
    <div class="flex h-11 items-center justify-between gap-4 border-b border-line-soft bg-ink-850 px-4">
      <div class="flex min-w-0 items-center gap-2.5">
        <span
          v-for="i in 3"
          :key="i"
          class="size-2.5 shrink-0 rounded-full bg-[#33383F]"
        />
        <span
          v-if="title"
          class="ml-2 truncate font-mono text-xs text-fg-dim"
        >{{ title }}</span>
      </div>
      <span
        v-if="meta"
        class="shrink-0 font-mono text-xs text-fg-dim"
      >{{ meta }}</span>
    </div>

    <div class="overflow-x-auto">
      <div class="min-w-[36rem] px-5 py-6 font-mono text-[13.5px] leading-normal sm:px-6">
        <slot />
      </div>
    </div>
  </div>
</template>

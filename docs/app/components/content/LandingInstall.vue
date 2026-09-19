<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  items: { label: string, command: string, note: string }[]
  copyLabel: string
  copiedLabel: string
}>()

const root = useReveal()
const active = ref(0)
const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  const command = props.items[active.value]?.command
  if (!command) return
  try {
    await navigator.clipboard.writeText(command)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 2000)
  }
  catch {
    copied.value = false
  }
}
</script>

<template>
  <section
    ref="root"
    class="border-y border-default bg-elevated/30"
  >
    <UContainer class="reveal flex flex-col items-center gap-3 py-7">
      <div class="flex items-center gap-1">
        <button
          v-for="(item, index) in items"
          :key="item.label"
          type="button"
          class="rounded-md px-2.5 py-1 text-sm transition-colors"
          :class="index === active ? 'bg-default text-highlighted shadow-sm' : 'text-muted hover:text-highlighted'"
          :aria-pressed="index === active"
          @click="active = index"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="flex w-full max-w-xl items-center gap-3 rounded-md border border-default bg-default px-4 py-2.5">
        <span
          class="shrink-0 font-mono text-sm text-dimmed select-none"
          aria-hidden="true"
        >$</span>
        <code class="min-w-0 flex-1 overflow-x-auto font-mono text-sm whitespace-nowrap text-highlighted">{{ items[active]?.command }}</code>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="landing-cta"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          :aria-label="copied ? copiedLabel : copyLabel"
          @click="copy()"
        />
      </div>

      <p class="text-center text-sm text-muted">
        {{ items[active]?.note }}
      </p>
    </UContainer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Issue } from '@ranklint/core'
import rulesIndex from '~~/rules-index.json'
import { LEVEL1_COUNT, lintHtml } from '~/utils/lint-html'
import type { Level } from '~/utils/severity'

const props = defineProps<{ sample: string }>()

const VISIBLE = 5

const { t, locale } = useI18n()

const html = ref(props.sample)
const issues = ref<Issue[]>([])
const state = ref<'idle' | 'running' | 'done' | 'failed'>('idle')
const expanded = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

const shown = computed(() => expanded.value ? issues.value : issues.value.slice(0, VISIBLE))
const hidden = computed(() => Math.max(issues.value.length - VISIBLE, 0))

const dot: Record<Level, string> = {
  error: 'bg-sev-error',
  warn: 'bg-sev-warn',
  info: 'bg-sev-info',
  off: 'bg-fg-faint',
}

function rulePath(issue: Issue): string | undefined {
  if (!issue.docs) return undefined
  const path = new URL(issue.docs).pathname.replace(/^\/[a-z]{2}(?=\/)/, '')
  return `/${locale.value}${path}`
}

async function run() {
  expanded.value = false
  if (!html.value.trim()) {
    issues.value = []
    state.value = 'idle'
    return
  }
  try {
    issues.value = await lintHtml(html.value)
    state.value = 'done'
  } catch {
    issues.value = []
    state.value = 'failed'
  }
}

function edit() {
  clearTimeout(timer)
  timer = setTimeout(run, 250)
}

onMounted(() => {
  state.value = 'running'
  setTimeout(run, 150)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div>
    <label
      for="ranklint-demo-html"
      class="sr-only"
    >{{ t('landing.demo.inputLabel') }}</label>
    <textarea
      id="ranklint-demo-html"
      v-model="html"
      rows="8"
      spellcheck="false"
      class="block w-full resize-y rounded-xl border border-line bg-ink-850 p-4 font-mono text-[12.5px] leading-relaxed text-fg-soft"
      @input="edit"
    />

    <div class="mt-4 min-h-[18rem]">
      <div
        v-if="state === 'running'"
        class="flex flex-col gap-2"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="h-14 animate-pulse rounded-xl bg-ink-850"
        />
      </div>

      <p
        v-else-if="state === 'failed'"
        class="rounded-xl border border-line bg-ink-850 px-4 py-3 text-sm text-fg-muted"
      >
        {{ t('landing.demo.errorLabel') }}
      </p>

      <p
        v-else-if="!html.trim()"
        class="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-fg-muted"
      >
        {{ t('landing.demo.emptyLabel') }}
      </p>

      <p
        v-else-if="issues.length === 0"
        class="rounded-xl border border-acid-line bg-acid/[7%] px-4 py-3 text-sm font-semibold text-acid"
      >
        {{ t('landing.demo.cleanLabel') }}
      </p>

      <template v-else>
        <p class="font-mono text-[12.5px] uppercase tracking-[0.1em] text-fg-faint">
          {{ t('landing.demo.foundLabel', { count: issues.length }) }}
        </p>

        <div
          v-for="(issue, index) in shown"
          :key="`${issue.checkId}-${index}`"
          class="flex items-start gap-3 border-t border-line-soft py-3.5"
        >
          <span
            class="mt-1.5 size-1.5 shrink-0 rounded-full"
            :class="dot[issue.severity as Level] ?? 'bg-fg-faint'"
          />
          <div class="flex min-w-0 flex-col gap-1">
            <NuxtLink
              :to="rulePath(issue)"
              class="font-mono text-[13px] text-fg no-underline underline-offset-4 hover:underline"
            >
              {{ issue.checkId }}
            </NuxtLink>
            <span class="text-[13px] text-fg-dim">{{ issue.message }}</span>
            <span
              v-if="issue.suggestion"
              class="text-[13px] text-fg-faint"
            >{{ issue.suggestion }}</span>
          </div>
        </div>

        <button
          v-if="hidden > 0 && !expanded"
          type="button"
          class="mt-3 inline-flex h-9 items-center rounded-lg border border-line bg-ink-800 px-3.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
          @click="expanded = true"
        >
          {{ t('landing.demo.moreLabel', { count: hidden }) }}
        </button>
      </template>
    </div>

    <p class="mt-4 text-[13px] text-fg-faint">
      {{ t('landing.demo.footnote', { count: LEVEL1_COUNT, total: rulesIndex.total }) }}
    </p>
  </div>
</template>

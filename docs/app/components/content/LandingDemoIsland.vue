<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Issue } from '@ranklint/core'
import rulesIndex from '~~/rules-index.json'
import type { DemoLabels } from '~/utils/demo'
import { LEVEL1_COUNT, lintHtml } from '~/utils/lint-html'

const props = defineProps<{ labels: DemoLabels, sample: string }>()

const VISIBLE = 5

const { locale } = useDocusI18n()

const html = ref(props.sample)
const issues = ref<Issue[]>([])
const state = ref<'idle' | 'running' | 'done' | 'failed'>('idle')
const expanded = ref(false)
const cascade = ref(true)
let timer: ReturnType<typeof setTimeout> | undefined

const shown = computed(() => expanded.value ? issues.value : issues.value.slice(0, VISIBLE))
const hidden = computed(() => Math.max(issues.value.length - VISIBLE, 0))

const footnoteText = computed(() => props.labels.footnote
  .replace('{count}', String(LEVEL1_COUNT))
  .replace('{total}', String(rulesIndex.total)))

const foundText = computed(() => props.labels.foundLabel.replace('{count}', String(issues.value.length)))
const moreText = computed(() => props.labels.moreLabel.replace('{count}', String(hidden.value)))

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
  }
  catch {
    issues.value = []
    state.value = 'failed'
  }
  cascade.value = false
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
      class="block text-sm font-medium text-highlighted"
    >{{ labels.inputLabel }}</label>
    <textarea
      id="ranklint-demo-html"
      v-model="html"
      rows="6"
      spellcheck="false"
      class="mt-2 block w-full resize-y rounded-md border border-accented bg-default p-3 font-mono text-xs leading-relaxed text-highlighted focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      @input="edit"
    />

    <div class="mt-4 min-h-[18rem]">
      <div
        v-if="state === 'running'"
        class="grid gap-2"
      >
        <div
          v-for="n in 4"
          :key="n"
          class="h-14 animate-pulse rounded-md bg-elevated"
        />
      </div>

      <p
        v-else-if="state === 'failed'"
        class="rounded-md border border-default bg-default px-4 py-3 text-sm text-muted"
      >
        {{ labels.errorLabel }}
      </p>

      <p
        v-else-if="!html.trim()"
        class="rounded-md border border-dashed border-default px-4 py-3 text-sm text-muted"
      >
        {{ labels.emptyLabel }}
      </p>

      <p
        v-else-if="issues.length === 0"
        class="rounded-md border border-default bg-default px-4 py-3 text-sm font-medium text-primary"
      >
        {{ labels.cleanLabel }}
      </p>

      <template v-else>
        <p class="text-sm font-medium text-highlighted">
          {{ foundText }}
        </p>

        <ul class="mt-3 grid gap-px overflow-hidden rounded-md border border-default bg-accented">
          <li
            v-for="(issue, index) in shown"
            :key="`${issue.checkId}-${index}`"
            class="bg-default px-3 py-2.5"
            :class="cascade ? 'rise' : ''"
            :style="`--rise-delay: ${Math.min(index, 8) * 50}ms`"
          >
            <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span
                class="rounded-sm px-1.5 py-0.5 font-mono text-[10px] uppercase"
                :class="issue.severity === 'error'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'"
              >{{ issue.severity }}</span>
              <NuxtLink
                :to="rulePath(issue)"
                class="inline-flex items-center gap-1 font-mono text-sm text-highlighted underline decoration-default underline-offset-4 hover:decoration-primary"
              >
                {{ issue.checkId }}
                <UIcon
                  name="i-lucide-arrow-up-right"
                  class="size-3.5 text-dimmed"
                />
              </NuxtLink>
            </div>
            <p class="mt-1 text-sm text-toned">
              {{ issue.message }}
            </p>
            <p
              v-if="issue.suggestion"
              class="mt-0.5 text-xs text-dimmed"
            >
              {{ issue.suggestion }}
            </p>
          </li>
        </ul>

        <UButton
          v-if="hidden > 0 && !expanded"
          color="neutral"
          variant="ghost"
          size="sm"
          class="landing-cta mt-2"
          @click="expanded = true"
        >
          {{ moreText }}
        </UButton>
      </template>
    </div>

    <p class="mt-3 text-xs text-dimmed">
      {{ footnoteText }}
    </p>
  </div>
</template>

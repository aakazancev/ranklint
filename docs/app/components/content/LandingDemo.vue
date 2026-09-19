<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { DEMO_SAMPLE, type DemoLabels } from '~/utils/demo'

defineProps<{ labels: DemoLabels }>()

const LandingDemoIsland = defineAsyncComponent(() => import('./LandingDemoIsland.vue'))
</script>

<template>
  <div class="rounded-md border border-default bg-elevated/40 p-3 shadow-[0_30px_70px_-45px_var(--ui-color-neutral-500)] sm:p-4">
    <ClientOnly>
      <LandingDemoIsland
        :labels="labels"
        :sample="DEMO_SAMPLE"
      />

      <template #fallback>
        <div>
          <p class="text-sm font-medium text-highlighted">
            {{ labels.inputLabel }}
          </p>
          <pre class="mt-2 h-[9.5rem] overflow-hidden rounded-md border border-accented bg-default p-3 font-mono text-xs leading-relaxed text-toned">{{ DEMO_SAMPLE }}</pre>
          <div class="mt-4 grid gap-2">
            <div
              v-for="n in 4"
              :key="n"
              class="h-14 animate-pulse rounded-md bg-elevated"
            />
          </div>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

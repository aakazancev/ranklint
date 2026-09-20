<script setup lang="ts">
import type { Level } from '~/utils/severity'

const { t } = useI18n()

const rows: { level: Level, rule: string, url: string, message: string }[] = [
  { level: 'error', rule: 'meta:title-required', url: '/bugs/title-missing', message: 'Page has no <title>' },
  { level: 'error', rule: 'meta:description-required', url: '/bugs/description-missing', message: 'Page has no meta description' },
  { level: 'error', rule: 'headings:single-h1', url: '/bugs/h1-multiple', message: 'Page has 2 <h1> elements, expected exactly 1' },
  { level: 'warn', rule: 'images:alt-required', url: '/bugs/images-bad', message: 'Image has no alt attribute' },
  { level: 'warn', rule: 'images:dimensions-required', url: '/bugs/images-bad', message: 'Image has no explicit width/height' },
  { level: 'warn', rule: 'images:no-lazy-above-fold', url: '/bugs/images-bad', message: 'Image in the viewport uses loading="lazy"' },
]

const formats = ['markdown', 'json', 'junit', 'html', 'gitlab', 'github']
</script>

<template>
  <SectionShell id="cli">
    <SectionHeading :eyebrow="t('landing.ci.eyebrow')">
      <template #title>
        {{ t('landing.ci.titleA') }}<br class="hidden sm:inline">
        {{ t('landing.ci.titleB') }}
      </template>
      <template #lead>
        {{ t('landing.ci.leadPre') }} <CodeChip>audit</CodeChip> {{ t('landing.ci.leadMid') }}
        <CodeChip>diff</CodeChip> {{ t('landing.ci.leadPost') }}
      </template>
    </SectionHeading>

    <div class="mt-11 grid gap-5 lg:grid-cols-12 lg:items-start">
      <div class="overflow-hidden rounded-2xl border border-line bg-ink-900 lg:col-span-8">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-ink-850 px-5 py-4">
          <h3 class="text-sm font-semibold text-fg">
            {{ t('landing.ci.tableTitle') }}
          </h3>
          <span class="font-mono text-xs text-fg-dim">--reporter markdown</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[40rem] border-collapse text-left">
            <thead>
              <tr class="border-b border-line-soft font-mono text-[11.5px] uppercase tracking-[0.08em] text-fg-faint">
                <th
                  scope="col"
                  class="w-24 px-5 py-3 font-normal"
                >
                  {{ t('landing.ci.head.level') }}
                </th>
                <th
                  scope="col"
                  class="w-62 px-2 py-3 font-normal"
                >
                  {{ t('landing.ci.head.rule') }}
                </th>
                <th
                  scope="col"
                  class="w-48 px-2 py-3 font-normal"
                >
                  {{ t('landing.ci.head.url') }}
                </th>
                <th
                  scope="col"
                  class="px-2 py-3 pr-5 font-normal"
                >
                  {{ t('landing.ci.head.what') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rows"
                :key="`${row.rule}-${row.url}`"
                class="border-b border-line-soft/60 text-[13px] last:border-b-0"
              >
                <td class="px-5 py-3.5">
                  <SeverityBadge :level="row.level" />
                </td>
                <td class="px-2 py-3.5 font-mono text-fg">
                  {{ row.rule }}
                </td>
                <td class="px-2 py-3.5 font-mono text-fg-muted">
                  {{ row.url }}
                </td>
                <td class="px-2 py-3.5 pr-5 text-fg-dim">
                  {{ row.message }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-ink-880 px-5 py-4">
          <span class="text-[13.5px] text-fg-dim">{{ t('landing.ci.note') }}</span>
          <span class="inline-flex h-7 items-center rounded-md bg-sev-error/[12%] px-3 font-mono text-[12.5px] font-bold text-sev-error-fg">
            exit 1
          </span>
        </div>
      </div>

      <div class="flex min-w-0 flex-col gap-4 lg:col-span-4">
        <div class="flex flex-col gap-3.5 rounded-2xl border border-line bg-ink-880 p-6">
          <h3 class="text-[17px] font-semibold text-fg">
            {{ t('landing.ci.formats.title') }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <CodeChip
              v-for="f in formats"
              :key="f"
              variant="boxed"
            >
              {{ f }}
            </CodeChip>
          </div>
          <p class="text-sm leading-relaxed text-fg-dim">
            {{ t('landing.ci.formats.note') }}
          </p>
        </div>

        <div class="flex flex-col gap-2.5 rounded-2xl border border-line bg-ink-880 p-6">
          <h3 class="text-[17px] font-semibold text-fg">
            {{ t('landing.ci.steps.title') }}
          </h3>
          <pre class="overflow-x-auto font-mono text-[13px] leading-relaxed"><code><span class="text-fg-faint">$ </span><span class="text-fg-soft">ranklint audit --url https://preview --reporter json --output report.json</span>
<span class="text-fg-faint">$ </span><span class="text-fg-soft">ranklint diff --base main --current report.json --reporter markdown</span></code></pre>
          <p class="mt-1.5 text-sm leading-relaxed text-fg-dim">
            {{ t('landing.ci.steps.note') }}
          </p>
        </div>
      </div>
    </div>
  </SectionShell>
</template>

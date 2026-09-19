<script setup lang="ts">
const logos = [
  { icon: 'i-simple-icons-nuxt', name: 'Nuxt' },
  { icon: 'i-simple-icons-github', name: 'GitHub' },
  { icon: 'i-simple-icons-gitlab', name: 'GitLab' },
  { icon: 'i-simple-icons-playwright', name: 'Playwright' },
  { icon: 'i-simple-icons-lighthouse', name: 'Lighthouse' },
  { icon: 'i-simple-icons-slack', name: 'Slack' },
  { icon: 'i-simple-icons-telegram', name: 'Telegram' },
]

const root = useReveal()
</script>

<template>
  <section
    ref="root"
    class="border-b border-default"
  >
    <UContainer class="reveal flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between sm:gap-8">
      <ul class="flex flex-wrap items-center justify-center gap-6">
        <li
          v-for="logo in logos"
          :key="logo.name"
        >
          <UIcon
            :name="logo.icon"
            :aria-label="logo.name"
            role="img"
            class="size-7 text-muted opacity-70"
          />
        </li>
      </ul>

      <p class="max-w-[42ch] text-center text-sm text-dimmed sm:text-right [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
        <slot name="note" />
      </p>
    </UContainer>
  </section>
</template>

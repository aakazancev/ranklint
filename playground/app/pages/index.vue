<script setup lang="ts">
useFixtureSeo({ title: 'Ranklint Playground fixture index page' })

const bugs = [
  'title-short',
  'title-missing',
  'description-missing',
  'description-short',
  'canonical-missing',
  'canonical-relative',
  'h1-multiple',
  'h1-missing',
  'h1-short',
  'heading-jump',
  'heading-empty',
  'broken-link',
]
</script>

<template>
  <main>
    <h1>Ranklint Playground fixture catalog</h1>
    <p>Clean page linking to every intentional SEO bug fixture.</p>
    <ul>
      <li v-for="bug in bugs" :key="bug">
        <NuxtLink :to="`/bugs/${bug}`">{{ bug }}</NuxtLink>
      </li>
    </ul>
  </main>
</template>

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
  'duplicate-title-a',
  'duplicate-title-b',
  'jsonld-broken',
  'images-bad',
  'noindex-in-sitemap',
  'og-missing',
  'canonical-chain-a',
  'canonical-chain-b',
  'canonical-chain-c',
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
      <li>
        <NuxtLink to="/jsonld">jsonld (clean)</NuxtLink>
      </li>
    </ul>
  </main>
</template>

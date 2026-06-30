<script setup lang="ts">
useFixtureSeo()
useHead({
  script: [
    { type: 'application/ld+json', innerHTML: '{broken json' },
    { type: 'application/ld+json', innerHTML: JSON.stringify({ '@type': 'Article' }) },
  ],
})
</script>

<template>
  <main>
    <h1>Broken structured data fixture heading</h1>
    <p>One unparseable block and one invalid Article.</p>
  </main>
</template>

<script setup lang="ts">
const url = useRequestURL()
useFixtureSeo({ canonical: `${url.origin}/bugs/canonical-chain-b` })
</script>

<template>
  <main>
    <h1>Canonical chain start fixture heading</h1>
  </main>
</template>

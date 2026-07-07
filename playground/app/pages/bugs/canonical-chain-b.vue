<script setup lang="ts">
const url = useRequestURL()
useFixtureSeo({ canonical: `${url.origin}/bugs/canonical-chain-c` })
</script>

<template>
  <main>
    <h1>Canonical chain middle fixture heading</h1>
  </main>
</template>

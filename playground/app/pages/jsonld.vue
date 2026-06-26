<script setup lang="ts">
useFixtureSeo({ title: 'JSON-LD structured data fixture page' })
useJsonLd('Product', {
  name: 'Ranklint Test Widget',
  offers: { price: 9.99, priceCurrency: 'USD' },
})
useRanklintIgnore(['meta:description-length'])
</script>

<template>
  <main>
    <h1>Structured data fixture with valid product</h1>
    <p>Used by module integration tests.</p>
  </main>
</template>

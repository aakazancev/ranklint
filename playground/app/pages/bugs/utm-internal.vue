<script setup lang="ts">
useFixtureSeo()
</script>

<template>
  <main>
    <h1>Internal UTM link fixture main heading here</h1>
    <p>
      <NuxtLink to="/bugs/utm-internal-target?utm_source=fixture&utm_medium=internal">
        This internal link carries UTM parameters on purpose
      </NuxtLink>
    </p>
  </main>
</template>

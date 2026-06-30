<script setup lang="ts">
useFixtureSeo()
</script>

<template>
  <main>
    <h1>Broken link fixture main heading here</h1>
    <p>
      <NuxtLink to="/bugs/nowhere-to-be-found">
        This link is intentionally broken
      </NuxtLink>
    </p>
  </main>
</template>

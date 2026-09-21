<script setup lang="ts">
const url = useRequestURL()
useFixtureSeo({ title: 'Localized twin pages share this exact title' })
useHead({
  link: [
    { rel: 'alternate', hreflang: 'en', href: `${url.origin}/bugs/duplicate-title-i18n-a` },
    { rel: 'alternate', hreflang: 'ru', href: `${url.origin}/bugs/duplicate-title-i18n-b` },
    { rel: 'alternate', hreflang: 'x-default', href: `${url.origin}/bugs/duplicate-title-i18n-a` },
  ],
})
</script>

<template>
  <main>
    <h1>Russian version of the localized twin fixture</h1>
    <p>Shares its title with the localized twin page and declares it via hreflang.</p>
  </main>
</template>

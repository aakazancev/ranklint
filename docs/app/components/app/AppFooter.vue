<script setup lang="ts">
import { computed } from 'vue'

const { locale } = useDocusI18n()

const labels = {
  en: {
    docs: 'Docs',
    cli: 'CLI',
    rules: 'Rules',
    project: 'Project',
    introduction: 'Introduction',
    installation: 'Installation',
    module: 'Nuxt module',
    audit: 'audit',
    diff: 'diff and CI',
    monitor: 'monitor',
    all: 'All rules',
    config: 'Config reference',
    custom: 'Custom rules',
    github: 'GitHub',
    changelog: 'Releases',
    license: 'MIT license',
  },
  ru: {
    docs: 'Дока',
    cli: 'CLI',
    rules: 'Правила',
    project: 'Проект',
    introduction: 'Введение',
    installation: 'Установка',
    module: 'Модуль Nuxt',
    audit: 'audit',
    diff: 'diff и CI',
    monitor: 'monitor',
    all: 'Все правила',
    config: 'Справочник конфига',
    custom: 'Свои правила',
    github: 'GitHub',
    changelog: 'Релизы',
    license: 'Лицензия MIT',
  },
}

const repo = 'https://github.com/aakazancev/ranklint'

const columns = computed(() => {
  const t = labels[locale.value === 'ru' ? 'ru' : 'en']
  const prefix = `/${locale.value}`
  return [
    {
      label: t.docs,
      children: [
        { label: t.introduction, to: `${prefix}/getting-started/introduction` },
        { label: t.installation, to: `${prefix}/getting-started/installation` },
        { label: t.module, to: `${prefix}/module/overview` },
      ],
    },
    {
      label: t.cli,
      children: [
        { label: t.audit, to: `${prefix}/cli/audit` },
        { label: t.diff, to: `${prefix}/cli/diff-and-ci` },
        { label: t.monitor, to: `${prefix}/cli/monitor` },
      ],
    },
    {
      label: t.rules,
      children: [
        { label: t.all, to: `${prefix}/rules` },
        { label: t.config, to: `${prefix}/config/reference` },
        { label: t.custom, to: `${prefix}/advanced/custom-rules` },
      ],
    },
    {
      label: t.github,
      children: [
        { label: t.changelog, to: `${repo}/releases`, target: '_blank' },
        { label: t.license, to: `${repo}/blob/main/LICENSE`, target: '_blank' },
      ],
    },
  ]
})
</script>

<template>
  <UFooter>
    <template #top>
      <UFooterColumns :columns="columns" />
    </template>

    <template #left>
      <AppFooterLeft />
    </template>

    <template #right>
      <AppFooterRight />
    </template>
  </UFooter>
</template>

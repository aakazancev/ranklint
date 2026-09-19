<script setup lang="ts">
defineProps<{
  imageLight: string
  imageDark: string
  imageAlt: string
  imageWidth: number
  imageHeight: number
  mobileLight: string
  mobileDark: string
  mobileWidth: number
  mobileHeight: number
}>()

const root = useReveal()
</script>

<template>
  <section
    ref="root"
    class="overflow-hidden"
  >
    <UContainer class="pt-16 lg:pt-24">
      <div class="reveal">
        <h2 class="max-w-[13em] text-3xl font-semibold tracking-tight text-highlighted sm:text-4xl lg:text-5xl">
          <slot name="title" />
        </h2>
      </div>
      <div class="reveal mt-5 max-w-[56ch] text-muted [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
        <slot name="description" />
      </div>
    </UContainer>

    <UContainer class="mt-10 lg:mt-14">
      <div class="reveal landing-bleed -mr-4 max-h-[26rem] overflow-hidden rounded-l-md border-y border-l border-default sm:-mr-6 lg:max-h-[34rem] lg:-mr-8 xl:-mr-24">
        <div class="lg:hidden">
          <img
            :src="mobileLight"
            :alt="imageAlt"
            :width="mobileWidth"
            :height="mobileHeight"
            loading="lazy"
            decoding="async"
            class="block h-auto w-full max-w-none dark:hidden"
          >
          <img
            :src="mobileDark"
            :alt="imageAlt"
            :width="mobileWidth"
            :height="mobileHeight"
            loading="lazy"
            decoding="async"
            class="hidden h-auto w-full max-w-none dark:block"
          >
        </div>

        <div class="hidden lg:block">
          <img
            :src="imageLight"
            :alt="imageAlt"
            :width="imageWidth"
            :height="imageHeight"
            loading="lazy"
            decoding="async"
            class="block h-auto w-full max-w-none dark:hidden"
          >
          <img
            :src="imageDark"
            :alt="imageAlt"
            :width="imageWidth"
            :height="imageHeight"
            loading="lazy"
            decoding="async"
            class="hidden h-auto w-full max-w-none dark:block"
          >
        </div>
      </div>
    </UContainer>
  </section>
</template>

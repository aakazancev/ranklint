<script setup lang="ts">
interface FaqItem {
  label: string
  content: string
  to?: string
  linkLabel?: string
}

const props = defineProps<{
  faqTitle: string
  items: FaqItem[]
}>()

const root = useReveal()

useJsonLd('FAQPage', {
  mainEntity: props.items.map(item => ({
    '@type': 'Question',
    'name': item.label,
    'acceptedAnswer': { '@type': 'Answer', text: item.content },
  })),
})
</script>

<template>
  <section
    ref="root"
    class="border-y border-default bg-elevated/30"
  >
    <UContainer class="py-16 lg:py-24">
      <div class="reveal mx-auto max-w-[65ch] [&_blockquote]:my-10 [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:text-xl [&_blockquote]:leading-snug [&_blockquote]:font-medium [&_blockquote]:text-highlighted [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-highlighted [&_h2>a]:text-highlighted [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-highlighted [&_h3>a]:text-highlighted [&_p]:mt-4 [&_p]:text-muted [&_p>a]:text-primary [&_p>a]:underline-offset-4 hover:[&_p>a]:underline">
        <slot />
      </div>

      <div class="reveal mx-auto mt-14 max-w-[65ch]">
        <h3 class="text-lg font-semibold text-highlighted">
          {{ faqTitle }}
        </h3>

        <UAccordion
          :items="items"
          class="mt-4"
        >
          <template #body="{ item }">
            <p class="text-sm text-muted">
              {{ item.content }}
            </p>
            <NuxtLink
              v-if="item.to"
              :to="item.to"
              class="mt-2 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {{ item.linkLabel }}
            </NuxtLink>
          </template>
        </UAccordion>
      </div>
    </UContainer>
  </section>
</template>

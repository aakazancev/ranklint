<script setup lang="ts">
defineProps<{ name: 'github' | 'arrow' | 'copy' | 'cube' | 'panel' | 'chevrons' }>()
</script>

<template>
  <svg
    v-if="name === 'github'"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    class="size-[18px]"
  >
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </svg>

  <svg
    v-else-if="name === 'arrow'"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    class="size-4"
  >
    <path
      d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="name === 'copy'"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    class="size-3.5"
  >
    <rect
      x="5.5"
      y="5.5"
      width="8"
      height="8"
      rx="2"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M10.5 3.5A1.5 1.5 0 0 0 9 2H4a2 2 0 0 0-2 2v5a1.5 1.5 0 0 0 1.5 1.5"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
  </svg>

  <svg
    v-else-if="name === 'cube'"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    class="size-[22px]"
  >
    <path
      d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
    <path
      d="M12 12l8-4.5M12 12v9M12 12L4 7.5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else-if="name === 'panel'"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    class="size-[22px]"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="16"
      rx="2.5"
      stroke="currentColor"
      stroke-width="1.6"
    />
    <path
      d="M3 9h18"
      stroke="currentColor"
      stroke-width="1.6"
    />
    <path
      d="M7 13.5l2 2 4-4.5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>

  <svg
    v-else
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    class="size-[22px]"
  >
    <path
      d="M4 7l4 5-4 5"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M12 17h8"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
    />
  </svg>
</template>

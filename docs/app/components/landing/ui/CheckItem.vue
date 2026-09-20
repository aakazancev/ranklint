<template>
  <li class="flex items-start gap-3 text-[15.5px] leading-snug text-fg-soft">
    <svg
      class="mt-0.5 size-[18px] shrink-0"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="8.25"
        stroke="currentColor"
        class="text-line-strong"
        stroke-width="1.5"
      />
      <path
        d="M6.5 10.2l2.3 2.3 4.7-5.2"
        stroke="currentColor"
        class="text-acid"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span><slot /></span>
  </li>
</template>

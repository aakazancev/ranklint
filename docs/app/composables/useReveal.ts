import { onBeforeUnmount, onMounted, ref } from 'vue'

const REVEAL_MARGIN = '100000px 0px -8% 0px'

export function useReveal() {
  const root = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | undefined

  onMounted(() => {
    const el = root.value
    if (!el || typeof IntersectionObserver === 'undefined') return

    observer = new IntersectionObserver((entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-visible')
        self.unobserve(entry.target)
      }
    }, { rootMargin: REVEAL_MARGIN })

    const targets = [
      ...(el.classList.contains('reveal') ? [el] : []),
      ...el.querySelectorAll<HTMLElement>('.reveal'),
    ]
    for (const target of targets) observer.observe(target)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return root
}

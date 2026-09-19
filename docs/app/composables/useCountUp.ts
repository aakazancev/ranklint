import { onBeforeUnmount, onMounted, ref } from 'vue'

const COUNT_DURATION = 600

export function useCountUp(target: number) {
  const el = ref<HTMLElement | null>(null)
  const value = ref(target)
  let observer: IntersectionObserver | undefined
  let frame = 0

  onMounted(() => {
    const node = el.value
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    value.value = 0
    observer = new IntersectionObserver((entries, self) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        self.unobserve(entry.target)
        const start = performance.now()
        const step = (now: number) => {
          const progress = Math.min((now - start) / COUNT_DURATION, 1)
          value.value = Math.round(target * (1 - (1 - progress) ** 3))
          if (progress < 1) frame = requestAnimationFrame(step)
        }
        frame = requestAnimationFrame(step)
      }
    }, { threshold: 0.4 })
    observer.observe(node)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    cancelAnimationFrame(frame)
  })

  return { el, value }
}

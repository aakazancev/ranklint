import type { NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'

export interface HostPage {
  document: Document
  readUrl(): string
  onChange(cb: () => void): void
  scrollTo(selector: string, index?: number): boolean
  dispose(): void
}

const FLASH_MS = 1600
const DEBOUNCE_MS = 400
const MAX_WAIT_MS = 2000

export function connectHostPage(client: NuxtDevtoolsIframeClient): HostPage | null {
  let doc: Document | undefined
  try {
    doc = client.host.getIframe()?.ownerDocument ?? window.parent?.parent?.document
  } catch {
    return null
  }
  const win = doc?.defaultView
  if (!doc || !win) return null

  const listeners: Array<() => void> = []
  let timer: ReturnType<typeof setTimeout> | undefined
  let oldestPending = 0
  let activeFlashes = 0
  const notify = () => {
    if (activeFlashes > 0) return
    const now = Date.now()
    if (oldestPending === 0) oldestPending = now
    clearTimeout(timer)
    const delay = now - oldestPending >= MAX_WAIT_MS ? 0 : DEBOUNCE_MS
    timer = setTimeout(() => {
      oldestPending = 0
      listeners.forEach(cb => cb())
    }, delay)
  }

  const observer = new win.MutationObserver(notify)
  observer.observe(doc.documentElement, { subtree: true, childList: true, attributes: true, characterData: true })

  const router = (client.host.nuxt as { $router?: { afterEach(cb: () => void): () => void } }).$router
  const unhook = router?.afterEach(notify)

  return {
    document: doc,
    readUrl: () => win.location.href,
    onChange: cb => listeners.push(cb),
    scrollTo(selector, index = 0) {
      let el: Element | undefined
      try {
        el = [...doc.querySelectorAll(selector)][index]
      } catch {
        return false
      }
      if (!el) return false
      activeFlashes++
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const target = el as HTMLElement
      const saved = target.style.outline
      const savedOffset = target.style.outlineOffset
      target.style.outline = '3px solid #00dc82'
      target.style.outlineOffset = '2px'
      setTimeout(() => {
        target.style.outline = saved
        target.style.outlineOffset = savedOffset
        setTimeout(() => { activeFlashes-- }, 50)
      }, FLASH_MS)
      return true
    },
    dispose() {
      observer.disconnect()
      unhook?.()
      clearTimeout(timer)
    },
  }
}

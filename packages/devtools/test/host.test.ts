import type { NuxtDevtoolsIframeClient } from '@nuxt/devtools-kit/types'
import { describe, expect, it } from 'vitest'
import { connectHostPage } from '../src/client/host'

function fakeClient(): NuxtDevtoolsIframeClient {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  return {
    host: {
      getIframe: () => iframe,
      nuxt: {},
    },
  } as unknown as NuxtDevtoolsIframeClient
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

describe('connectHostPage', () => {
  it('debounces mutation notifications into a single change event', async () => {
    const page = connectHostPage(fakeClient())!
    expect(page).not.toBeNull()
    let calls = 0
    page.onChange(() => calls++)
    for (let i = 0; i < 5; i++) {
      document.body.append(document.createElement('div'))
      await wait(30)
    }
    await wait(600)
    expect(calls).toBe(1)
    page.dispose()
  })

  it('fires despite continuous mutations once max-wait is exceeded', async () => {
    const page = connectHostPage(fakeClient())!
    let calls = 0
    page.onChange(() => calls++)
    const interval = setInterval(() => document.body.append(document.createElement('span')), 100)
    await wait(2600)
    clearInterval(interval)
    expect(calls).toBeGreaterThanOrEqual(1)
    page.dispose()
  }, 10_000)

  it('scrollTo highlights the target, suppresses self-inflicted mutations, and rejects bad selectors', async () => {
    const page = connectHostPage(fakeClient())!
    let calls = 0
    page.onChange(() => calls++)
    const target = document.createElement('h1')
    target.scrollIntoView = () => {}
    document.body.append(target)
    await wait(600)
    calls = 0
    expect(page.scrollTo('h1')).toBe(true)
    expect(target.style.outline).toContain('#00dc82')
    await wait(500)
    expect(calls).toBe(0)
    expect(page.scrollTo('nope')).toBe(false)
    expect(page.scrollTo('[[[')).toBe(false)
    page.dispose()
  })

  it('dispose stops change notifications', async () => {
    const page = connectHostPage(fakeClient())!
    let calls = 0
    page.onChange(() => calls++)
    page.dispose()
    document.body.append(document.createElement('div'))
    await wait(600)
    expect(calls).toBe(0)
  })
})

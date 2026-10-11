import type { LighthouseRunner, LighthouseRunRaw } from './lighthouse'

export function rejectOnUnhandled<T>(task: Promise<T>): Promise<T> {
  let listener: (reason: unknown) => void = () => {}
  const crashed = new Promise<never>((_, reject) => {
    listener = reason => reject(reason instanceof Error ? reason : new Error(String(reason)))
    process.on('unhandledRejection', listener)
  })
  return Promise.race([task, crashed]).finally(() => process.off('unhandledRejection', listener))
}

export const realLighthouseRunner: LighthouseRunner = async (url, opts): Promise<LighthouseRunRaw> => {
  const [{ default: lighthouse }, chromeLauncher] = await Promise.all([
    import('lighthouse'),
    import('chrome-launcher'),
  ])
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--disable-dev-shm-usage'] })
  try {
    const result = await rejectOnUnhandled(lighthouse(url, {
      port: chrome.port,
      output: 'json',
      formFactor: opts.formFactor,
      screenEmulation: opts.formFactor === 'desktop'
        ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
        : undefined,
      onlyCategories: ['performance', 'seo', 'accessibility', 'best-practices'],
    }))
    const lhr = result?.lhr
    if (!lhr) throw new Error(`Lighthouse returned no result for ${url}`)
    const score = (id: string) => {
      const value = lhr.categories[id]?.score
      return typeof value === 'number' ? Math.round(value * 100) : undefined
    }
    const audit = (id: string) => {
      const value = lhr.audits[id]?.numericValue
      return typeof value === 'number' ? Math.round(value) : undefined
    }
    const lcpItems = (lhr.audits['largest-contentful-paint-element']?.details as
      { items?: { items?: { node?: { snippet?: string } }[] }[] } | undefined)?.items?.[0]?.items
    return {
      metrics: {
        performance: score('performance'),
        seo: score('seo'),
        accessibility: score('accessibility'),
        bestPractices: score('best-practices'),
        lcp: audit('largest-contentful-paint'),
        cls: lhr.audits['cumulative-layout-shift']?.numericValue,
        tbt: audit('total-blocking-time'),
      },
      lcpSnippet: lcpItems?.[0]?.node?.snippet,
    }
  } finally {
    chrome.kill()
  }
}

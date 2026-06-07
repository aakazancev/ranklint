import { describe, expect, it } from 'vitest'
import { descriptionLength, descriptionRequired } from '../src/checks/meta/description'
import { titleLength, titleRequired } from '../src/checks/meta/title'
import { runCheckOnHtml } from '../src/test-utils'

const goodTitle = 'A perfectly sized page title for the test'
const goodDescription = 'A meta description that is long enough to satisfy the default minimum of seventy characters easily.'

function page(head: string): string {
  return `<html><head>${head}</head><body><h1>x</h1></body></html>`
}

describe('meta:title-required', () => {
  it('passes with a title', async () => {
    expect(await runCheckOnHtml(titleRequired, page(`<title>${goodTitle}</title>`))).toEqual([])
  })

  it('fails without a title and with an empty one', async () => {
    expect(await runCheckOnHtml(titleRequired, page(''))).toHaveLength(1)
    expect(await runCheckOnHtml(titleRequired, page('<title>  </title>'))).toHaveLength(1)
  })
})

describe('meta:title-length', () => {
  it('passes in range and stays silent when title is missing', async () => {
    expect(await runCheckOnHtml(titleLength, page(`<title>${goodTitle}</title>`))).toEqual([])
    expect(await runCheckOnHtml(titleLength, page(''))).toEqual([])
  })

  it('fails out of range and respects custom options', async () => {
    const short = await runCheckOnHtml(titleLength, page('<title>Tiny</title>'))
    expect(short).toHaveLength(1)
    expect(short[0]?.message).toContain('4 chars')
    expect(short[0]?.suggestion).toBeTruthy()
    expect(short[0]?.docs).toContain('meta-title-length')
    expect(await runCheckOnHtml(titleLength, page('<title>Tiny</title>'), { options: { min: 1 } })).toEqual([])
  })
})

describe('meta:description-required', () => {
  it('passes with description, fails without', async () => {
    expect(await runCheckOnHtml(descriptionRequired, page(`<meta name="description" content="${goodDescription}">`))).toEqual([])
    expect(await runCheckOnHtml(descriptionRequired, page(''))).toHaveLength(1)
    expect(await runCheckOnHtml(descriptionRequired, page('<meta name="description" content="">'))).toHaveLength(1)
  })
})

describe('meta:description-length', () => {
  it('passes in range, silent when missing', async () => {
    expect(await runCheckOnHtml(descriptionLength, page(`<meta name="description" content="${goodDescription}">`))).toEqual([])
    expect(await runCheckOnHtml(descriptionLength, page(''))).toEqual([])
  })

  it('fails when too short', async () => {
    const issues = await runCheckOnHtml(descriptionLength, page('<meta name="description" content="Too short.">'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.checkId).toBe('meta:description-length')
  })
})

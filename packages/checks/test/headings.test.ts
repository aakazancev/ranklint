import { describe, expect, it } from 'vitest'
import { h1Length, hierarchy, noEmpty, singleH1 } from '../src/checks/headings/headings'
import { runCheckOnHtml } from '../src/test-utils'

function body(content: string): string {
  return `<html><body>${content}</body></html>`
}

const goodH1 = '<h1>A heading that is long enough here</h1>'

describe('headings:single-h1', () => {
  it('passes with exactly one h1', async () => {
    expect(await runCheckOnHtml(singleH1, body(goodH1))).toEqual([])
  })

  it('fails with zero or two h1', async () => {
    const zero = await runCheckOnHtml(singleH1, body('<h2>x</h2>'))
    expect(zero[0]?.message).toContain('0')
    const two = await runCheckOnHtml(singleH1, body('<h1>a</h1><h1>b</h1>'))
    expect(two[0]?.message).toContain('2')
  })
})

describe('headings:no-empty', () => {
  it('flags each empty heading', async () => {
    const issues = await runCheckOnHtml(noEmpty, body(`${goodH1}<h2></h2><h3>  </h3>`))
    expect(issues).toHaveLength(2)
    expect(issues.map(i => i.selector)).toEqual(['h2', 'h3'])
  })

  it('passes when all headings have text', async () => {
    expect(await runCheckOnHtml(noEmpty, body(`${goodH1}<h2>ok</h2>`))).toEqual([])
  })
})

describe('headings:hierarchy', () => {
  it('flags level jumps', async () => {
    const issues = await runCheckOnHtml(hierarchy, body(`${goodH1}<h3>jump</h3>`))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('h1 to h3')
  })

  it('allows continuous outline and going back up', async () => {
    expect(await runCheckOnHtml(hierarchy, body(`${goodH1}<h2>a</h2><h3>b</h3><h2>c</h2>`))).toEqual([])
  })
})

describe('headings:h1-length', () => {
  it('passes in range, silent without h1', async () => {
    expect(await runCheckOnHtml(h1Length, body(goodH1))).toEqual([])
    expect(await runCheckOnHtml(h1Length, body('<h2>no h1 here</h2>'))).toEqual([])
  })

  it('fails when too short', async () => {
    const issues = await runCheckOnHtml(h1Length, body('<h1>Short</h1>'))
    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('5 chars')
  })
})

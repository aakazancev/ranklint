import { describe, expect, it } from 'vitest'
import { pageFilesToRoutes } from '../src/options'

describe('pageFilesToRoutes', () => {
  it('maps page files to routes', () => {
    expect(pageFilesToRoutes([
      'index.vue',
      'about.vue',
      'bugs/title-short.vue',
      'blog/index.vue',
    ])).toEqual(['/', '/about', '/blog', '/bugs/title-short'])
  })

  it('skips dynamic pages and non-vue files', () => {
    expect(pageFilesToRoutes(['listing/[id].vue', 'readme.md', '[...slug].vue'])).toEqual([])
  })
})

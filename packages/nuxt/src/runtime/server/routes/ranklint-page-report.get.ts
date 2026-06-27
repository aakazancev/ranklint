import { defineEventHandler, getQuery, getRequestURL } from '#imports'
import { buildPageReport } from '../utils/page-report'

export default defineEventHandler(async (event) => {
  const path = String(getQuery(event).path ?? '/')
  const origin = getRequestURL(event).origin
  const html = await $fetch<string>(path, { baseURL: origin, responseType: 'text' })
  return buildPageReport(html, `${origin}${path}`)
})

import type { CheckContext, Issue, PageSnapshot, Severity } from '@ranklint/core'
import { getDocument } from '@ranklint/core'
import { defineCheck, docsUrl } from '../../define'

function duplicateGroups(
  ctx: CheckContext,
  extract: (snapshot: PageSnapshot) => string,
): Map<string, PageSnapshot[]> {
  const groups = new Map<string, PageSnapshot[]>()
  for (const page of ctx.pages ?? []) {
    if (page.statusCode !== 200) continue
    const value = extract(page).trim()
    if (!value) continue
    const list = groups.get(value) ?? []
    list.push(page)
    groups.set(value, list)
  }
  return groups
}

function duplicateIssues(
  ctx: CheckContext,
  checkId: string,
  severity: Severity,
  label: string,
  selector: string,
  extract: (snapshot: PageSnapshot) => string,
): Issue[] {
  const issues: Issue[] = []
  for (const [value, pages] of duplicateGroups(ctx, extract)) {
    if (pages.length < 2) continue
    for (const page of pages) {
      issues.push({
        checkId,
        severity,
        message: `${label} "${value}" is shared by ${pages.length} pages`,
        url: page.url,
        selector,
        suggestion: `Make the ${label.toLowerCase()} unique for every page`,
        docs: docsUrl(checkId),
      })
    }
  }
  return issues
}

export const noDuplicateTitle = defineCheck({
  id: 'meta:no-duplicate-title',
  category: 'meta',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('meta:no-duplicate-title'),
  async run(ctx) {
    return duplicateIssues(ctx, 'meta:no-duplicate-title', 'error', 'Title', 'title', page =>
      getDocument(page).querySelector('title')?.textContent ?? '')
  },
})

export const noDuplicateDescription = defineCheck({
  id: 'meta:no-duplicate-description',
  category: 'meta',
  severity: 'error',
  scope: 'site',
  docs: docsUrl('meta:no-duplicate-description'),
  async run(ctx) {
    return duplicateIssues(ctx, 'meta:no-duplicate-description', 'error', 'Description', 'meta[name="description"]', page =>
      getDocument(page).querySelector('meta[name="description"]')?.getAttribute('content') ?? '')
  },
})

export const uniqueH1 = defineCheck({
  id: 'headings:unique-h1',
  category: 'headings',
  severity: 'warn',
  scope: 'site',
  docs: docsUrl('headings:unique-h1'),
  async run(ctx) {
    return duplicateIssues(ctx, 'headings:unique-h1', 'warn', 'H1', 'h1', page =>
      getDocument(page).querySelector('h1')?.textContent ?? '')
  },
})

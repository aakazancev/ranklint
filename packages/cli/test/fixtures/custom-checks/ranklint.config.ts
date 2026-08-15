export default {
  site: { url: 'https://custom.test' },
  rules: {
    'myteam:no-lorem': 'error',
  },
  customChecks: [
    {
      id: 'myteam:no-lorem',
      category: 'meta',
      severity: 'warn',
      scope: 'page',
      async run(ctx: { document?: Document, page?: { url: string } }) {
        const text = ctx.document?.querySelector('body')?.textContent ?? ''
        if (!/lorem ipsum/i.test(text)) return []
        return [{
          checkId: 'myteam:no-lorem',
          severity: 'warn' as const,
          message: 'Placeholder "lorem ipsum" text found on the page',
          url: ctx.page!.url,
          suggestion: 'Replace placeholder text with real content',
        }]
      },
    },
  ],
}

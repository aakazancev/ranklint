import { defineCheck } from '@ranklint/checks'

export default {
  rules: {
    'meta:title-length': ['warn', { min: 20, max: 70 }],
    'images:alt-required': 'off',
    'agency:no-lorem': 'warn',
  },
  customChecks: [
    defineCheck({
      id: 'agency:no-lorem',
      category: 'meta',
      severity: 'warn',
      scope: 'page',
      docs: 'https://agency.example/seo/no-lorem',
      async run(ctx) {
        const text = ctx.document?.body?.textContent ?? ''
        if (!/lorem ipsum/i.test(text)) return []
        return [{ checkId: 'agency:no-lorem', severity: 'warn', message: 'Placeholder text found', url: ctx.page!.url }]
      },
    }),
  ],
}

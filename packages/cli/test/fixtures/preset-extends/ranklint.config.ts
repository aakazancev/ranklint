export default {
  extends: ['./agency-preset.ts', '@ranklint/preset-default'],
  site: { url: 'https://preset-demo.com' },
  rules: {
    'images:alt-required': 'error',
  },
}

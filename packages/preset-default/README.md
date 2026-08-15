# @ranklint/preset-default

A [ranklint](https://github.com/aakazancev/ranklint) preset that pins all built-in rules at their default severities.

```ts
export default defineRanklintConfig({
  extends: ['@ranklint/preset-default'],
  site: { url: 'https://example.com' },
})
```

MIT.

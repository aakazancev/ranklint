export default {
  site: { url: 'https://car-market.com' },
  apps: {
    self: { paths: ['/market/**'] },
    main: { paths: ['/**'], owner: 'external', checks: ['links:reachable'] },
  },
  rules: {
    'meta:title-length': ['error', { min: 30, max: 60 }],
    'headings:single-h1': 'error',
    'meta:description-length': 'off',
  },
  crawl: { concurrency: 5, maxPages: 2000, ignore: ['/admin/**'] },
  profiles: {
    prod: { crawl: { concurrency: 2, delay: 500 } },
  },
}

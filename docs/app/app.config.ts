export default defineAppConfig({
  docus: {
    colorMode: 'dark',
    name: 'ranklint',
    description: 'Lint your SEO before Google does. Nuxt 4 module, CLI crawler and CI regression control.',
    url: 'https://ranklint.dev',
    socials: {
      github: 'aakazancev/ranklint',
    },
  },
  header: {
    title: 'ranklint',
  },
  ui: {
    colors: {
      primary: 'acid',
    },
  },
  seo: {
    titleTemplate: '%s · ranklint',
    schema: {
      type: 'SoftwareApplication',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      price: 0,
      priceCurrency: 'USD',
      sameAs: ['https://github.com/aakazancev/ranklint'],
      organization: {
        name: 'ranklint',
        sameAs: ['https://github.com/aakazancev/ranklint'],
      },
    },
  },
})

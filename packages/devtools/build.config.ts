import { fileURLToPath } from 'node:url'
import { defineBuildConfig } from 'unbuild'

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineBuildConfig([
  {
    entries: ['src/index'],
    declaration: true,
    clean: true,
  },
  {
    entries: [{ input: 'src/client/main', name: 'main' }],
    outDir: 'dist/client',
    clean: false,
    declaration: false,
    failOnWarn: false,
    externals: [],
    hooks: {
      'rollup:options'(_ctx, options) {
        options.external = id => id.startsWith('node:')
      },
    },
    rollup: {
      inlineDependencies: true,
      esbuild: { minify: true },
      replace: {
        values: {
          'process.env.NODE_ENV': '"production"',
          '__VUE_OPTIONS_API__': 'false',
          '__VUE_PROD_DEVTOOLS__': 'false',
          '__VUE_PROD_HYDRATION_MISMATCH_DETAILS__': 'false',
        },
      },
      alias: {
        entries: {
          '@ranklint/checks/level1': src('../checks/src/level1.ts'),
          '@ranklint/checks/schema-org': src('../checks/src/schema-org.ts'),
          '@ranklint/core': src('src/client/core-shim.ts'),
        },
      },
    },
  },
])

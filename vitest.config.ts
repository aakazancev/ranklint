import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'node',
          include: ['packages/*/test/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: ['**/node_modules/**', 'packages/devtools/test/host.test.ts', 'test/landing/**/*.dom.test.ts'],
          fileParallelism: false,
        },
      },
      {
        resolve: {
          alias: {
            '@ranklint/checks/level1': fileURLToPath(new URL('./packages/checks/src/level1.ts', import.meta.url)),
          },
        },
        test: {
          name: 'dom',
          include: ['packages/devtools/test/host.test.ts', 'test/landing/**/*.dom.test.ts'],
          environment: 'happy-dom',
          fileParallelism: false,
        },
      },
    ],
  },
})

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      {
        test: {
          name: 'node',
          include: ['packages/*/test/**/*.test.ts', 'test/**/*.test.ts'],
          exclude: ['**/node_modules/**', 'packages/devtools/test/host.test.ts'],
          fileParallelism: false,
        },
      },
      {
        test: {
          name: 'dom',
          include: ['packages/devtools/test/host.test.ts'],
          environment: 'happy-dom',
          fileParallelism: false,
        },
      },
    ],
  },
})

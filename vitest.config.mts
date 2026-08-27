import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Vitest does not read tsconfig's `paths`, so the `@/` alias the whole app
// imports through has to be declared again here. Without it, any test that
// imports a module by alias fails to resolve — and it fails at import time,
// which reads as a broken test rather than a missing config.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**'],
  },
})

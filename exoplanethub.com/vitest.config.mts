import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': rootDir,
      // The real module throws unless resolved under the react-server condition, which Vitest never sets.
      'server-only': resolve(rootDir, 'vitest.server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    // Class names as written, so a test can load a component's real stylesheet and read computed styles.
    css: { modules: { classNameStrategy: 'non-scoped' } },
    setupFiles: [resolve(rootDir, 'vitest.setup.ts')],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**'],
  },
});

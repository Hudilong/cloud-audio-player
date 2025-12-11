import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './app'),
      '@utils': resolve(__dirname, './utils'),
      '@services': resolve(__dirname, './services'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: 'tests/setup.ts',
  },
});

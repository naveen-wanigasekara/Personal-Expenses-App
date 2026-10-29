import { defineConfig } from 'vite';
import { assertPreviewIsolation } from './build/preview-isolation.js';
import { securePwa } from './build/secure-pwa.js';

assertPreviewIsolation(process.env);

export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  plugins: [securePwa()],
  test: { environment: 'jsdom', include: ['tests/*.ui.test.jsx'], clearMocks: true },
  server: { port: 5173, open: true },
  build: { outDir: 'dist', sourcemap: false },
});

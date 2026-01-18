import { defineConfig } from 'vite';

export default defineConfig({
  base: '/urban-warfare/', // GitHub Pages subdirectory
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

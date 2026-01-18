import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

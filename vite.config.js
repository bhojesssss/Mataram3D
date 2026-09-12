import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/components/...` instead of `../../components/...`
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    open: false,
    watch: {
      // OneDrive locks large model files mid-sync, which crashes the file
      // watcher (EBUSY); public assets don't need HMR anyway.
      ignored: ['**/public/models/**'],
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // three is the bulk of the homepage bundle; splitting it lets the browser
        // cache it across deploys where only site code changes.
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion';
          return null;
        },
      },
    },
  },
});

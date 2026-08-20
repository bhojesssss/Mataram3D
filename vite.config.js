import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const page = (file) => fileURLToPath(new URL(file, import.meta.url));

export default defineConfig({
  server: {
    port: 5173,
    open: false,
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      // A multi-page build, not a router: the homepage carries the 3D scene and
      // the inner pages are plain documents, so keeping them as separate entries
      // means none of three/gsap/lenis is shipped to History, Palace, and so on.
      input: {
        main: page('./index.html'),
        history: page('./history.html'),
        royalHouse: page('./royal-house.html'),
        palace: page('./palace.html'),
        archive: page('./archive.html'),
        about: page('./about.html'),
      },
      output: {
        // three is the bulk of the homepage bundle; splitting it lets the browser
        // cache it across deploys where only site code changes.
        manualChunks: {
          three: ['three'],
          motion: ['gsap', 'lenis'],
        },
      },
    },
  },
});

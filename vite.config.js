import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' lets the built site work from any folder (GitHub Pages project
// pages, a school server sub-folder, or the root of a domain). Routing uses the
// URL hash (#/learn) so no server rewrite rules are needed.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
  server: { host: true, port: 5173 },
  preview: { port: 4173 },
});

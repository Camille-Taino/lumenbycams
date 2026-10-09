import { defineConfig } from 'vite';
import { cpSync } from 'node:fs';

// Lumen uses plain (non-module) scripts and a service worker that caches fixed
// paths, so copy those files into dist/ as-is instead of letting Vite bundle them.
const STATIC = ['js', 'css', 'icons', 'sw.js', 'manifest.webmanifest'];

export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [
    {
      name: 'copy-static',
      apply: 'build',
      closeBundle() {
        for (const p of STATIC) cpSync(p, `dist/${p}`, { recursive: true });
      }
    }
  ]
});

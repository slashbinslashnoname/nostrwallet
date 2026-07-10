import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config'

export default defineConfig({
  plugins: [react(), tailwindcss(), crx({ manifest })],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // crxjs needs unminified-ish, deterministic chunk boundaries; default esbuild minify is fine.
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        options: 'src/options/index.html',
        approval: 'src/approval-window/index.html',
        offscreen: 'src/offscreen/offscreen.html',
      },
    },
  },
  server: {
    // Let Vite pick the next free port instead of failing when 5173 is busy.
    strictPort: false,
  },
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Relative asset paths so the same build works whether it is served from a
  // domain root (Vercel) or a repo subpath (GitHub Pages, /LLM_Tokenomics/).
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // PowerPoint content add-in that hosts the in-deck widgets
        addin: fileURLToPath(new URL('./addin.html', import.meta.url)),
      },
    },
  },
})

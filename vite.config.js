import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // Relative asset paths so the same build works whether it is served from a
  // domain root (Vercel) or a repo subpath (GitHub Pages, /LLM_Tokenomics/).
  base: './',
})

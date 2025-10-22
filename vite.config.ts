import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  publicDir: resolve(__dirname, 'assets'),
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html')
    },
    assetsInlineLimit: 0
  },
  server: {
    port: 3000
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/snacks/',  // This sets the base URL path for your app
  build: {
    outDir: '../snacks',  // Outputs to sibling /snacks folder for GitHub Pages
    emptyOutDir: true,
  },
})

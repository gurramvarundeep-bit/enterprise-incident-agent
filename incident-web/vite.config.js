import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so Amplify (and other static hosts) resolve JS/CSS
// next to index.html instead of from the domain root.
export default defineConfig({
  plugins: [react()],
  base: './',
})

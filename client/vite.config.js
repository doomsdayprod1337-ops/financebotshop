import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    allowedHosts: ['4324def8a2bf.ngrok-free.app']
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

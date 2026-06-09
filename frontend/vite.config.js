import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const BACKEND_PORT = process.env.BACKEND_PORT || '8081'

export default defineConfig({
  plugins: [react()],
  build: {
    // Built files go directly into Spring Boot's static folder.
    // Each Spring Boot instance (8081/8082/8083) serves the same React app.
    // API calls use /api/... (same origin), so no CORS issues.
    outDir: '../clients/src/main/resources/static',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
      },
    },
  },
})

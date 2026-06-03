import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Ensures all asset paths use root-relative URLs (critical for Render static site hosting)
  base: '/',

  build: {
    // Disable source maps in production — prevents source code leakage
    sourcemap: false,

    // Warn when individual chunks exceed 800KB (helps catch bundle bloat)
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Split large vendor libraries into separate chunks for better caching.
        // Vite 8 (rolldown) requires manualChunks to be a function, NOT a plain object.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              id.includes('/react/')
            ) {
              return 'vendor';
            }
            if (id.includes('recharts')) return 'charts';
            if (id.includes('framer-motion')) return 'motion';
          }
        },
      },
    },
  },
})


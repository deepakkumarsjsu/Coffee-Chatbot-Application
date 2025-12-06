import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Allow Fast Refresh to work with context files that export both hooks and components
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/runpod': {
        target: 'https://api.runpod.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/runpod/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the Authorization header if present
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        },
      },
      '/api/payments': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable minification
    minify: 'esbuild',
    // Generate source maps for production (optional, can disable for smaller build)
    sourcemap: false,
    // Chunk size warning limit (in kbs)
    chunkSizeWarningLimit: 1000,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/database', 'firebase/storage'],
          'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'ui-vendor': ['react-hot-toast', 'react-icons', 'react-easy-crop'],
        },
      },
    },
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  publicDir: 'public',
  assetsInclude: ['**/*.PNG', '**/*.png'],
})


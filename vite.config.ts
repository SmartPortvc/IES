import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Configure server to handle client-side routing
    historyApiFallback: true,
  },
  build: {
    // Generate source maps for better debugging
    sourcemap: true,
    // Ensure assets are properly loaded from the correct base URL
    assetsDir: 'assets',
    // Configure rollup options
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split UI components into separate chunk
          ui: ['lucide-react', 'react-toastify'],
        },
      },
    },
  },
});
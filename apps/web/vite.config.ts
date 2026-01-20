import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/taxonomy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/transactions': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/filters': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/products': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

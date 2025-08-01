import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
      '/api/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
      },
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

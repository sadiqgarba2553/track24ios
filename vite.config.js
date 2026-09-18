import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward all API calls to the Express proxy server on port 3000
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/ifapi': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/ifapi/, '/api'),
        changeOrigin: true
      },
      '/wiki': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/weather': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/upload-aircraft-image': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/admin': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});

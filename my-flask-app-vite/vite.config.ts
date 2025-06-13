import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
<<<<<<< HEAD
      '/api': 'http://127.0.0.1:5001',
=======
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', {
              method: req.method,
              url: req.url,
              target: 'http://localhost:5001' + req.url
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode,
              headers: proxyRes.headers
            });
          });
        },
      }
>>>>>>> origin/master
    }
  }
})

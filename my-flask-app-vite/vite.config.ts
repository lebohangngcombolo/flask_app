import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure(proxy) {
          proxy.on('error', (err) => {
            console.error('Proxy error:', err)
          })
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying request:', {
              method: req.method,
              url: req.url,
              target: 'http://localhost:5000' + req.url,
            })
          })
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Proxy response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode,
              headers: proxyRes.headers,
            })
          })
        },
      },
    },
  },
})

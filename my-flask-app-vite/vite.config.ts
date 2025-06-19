import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

<<<<<<< HEAD
=======
// https://vitejs.dev/config/
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
<<<<<<< HEAD
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
=======
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
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
            console.log('Proxy response:', {
              method: req.method,
              url: req.url,
              status: proxyRes.statusCode,
<<<<<<< HEAD
              headers: proxyRes.headers,
            })
          })
        },
      },
    },
  },
=======
              headers: proxyRes.headers
            });
          });
        },
      }
>>>>>>> origin/master
    }
  }
>>>>>>> 03ccbce380626419915c5ff9484c34b37668a0ea
})

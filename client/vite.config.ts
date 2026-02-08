import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 监听所有网络接口，允许公网访问
    port: 5173,
    proxy: {
      '/exams': {
        target: 'http://127.0.0.1:3000', // 后端在同一服务器，使用本地地址
        changeOrigin: true, // 修改请求头中的 Origin
        rewrite: (path) => path, // 保持路径不变
      },
      '/pdf': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      }
    }
  }
})

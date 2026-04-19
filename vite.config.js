import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],

    base: '/',

    server: {
      port: 5173,

      proxy: {
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:8090',
          changeOrigin: true,
          secure: false,
        }
      }
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
    }
  }
})

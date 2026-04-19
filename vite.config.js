import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения для текущего режима
  const env = loadEnv(mode, process.cwd(), '')

  // URL backend из переменной окружения или значение по умолчанию
  const backendUrl = env.VITE_BACKEND_URL || 'http://192.168.1.79:8102'

  return {
    plugins: [vue()],

    // Базовый путь для приложения
    // '/' - для корня домена
    // Если приложение будет размещено в подпапке, измените на '/ваша-папка/'
    base: '/',

    // Настройки сервера разработки
    server: {
      // Порт, на котором запускается dev-сервер
      port: 5173,

      // Проксирование API-запросов на backend
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        }
      }
    },

    // Настройки для production-сборки
    build: {
      // Папка для скомпилированных файлов
      outDir: 'dist',
      // Очищать папку перед сборкой
      emptyOutDir: true,
    }
  }
})

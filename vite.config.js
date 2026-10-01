import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      '/clobr-api': {
        target: 'https://clobr.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clobr-api/, ''),
      },
    },
  },
})


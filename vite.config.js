import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey =
    env.VITE_Birdeye_Api_Key ||
    env.VITE_BIRDEYE_API_KEY ||
    env.BirdeyeApiKey ||
    process.env.VITE_Birdeye_Api_Key ||
    process.env.VITE_BIRDEYE_API_KEY ||
    process.env.BirdeyeApiKey ||
    ''

  return {
    plugins: [vue(), tailwindcss()],
    define: {
      'process.env.BirdeyeApiKey': JSON.stringify(apiKey)
    }
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import terser from '@rollup/plugin-terser';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/app/',
  plugins: [vue()],
  server: {
    port: 8080,
    host: true
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'stats.html'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    // PrimeVue 4 no se puede dividir más debido a dependencias internas entre componentes.
    // El chunk más grande (vendor-primevue-ui) pesa ~184 kB gzipped, aceptable para la librería.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // PrimeVue tema / tokens (@primeuix)
          if (id.includes('@primeuix')) {
            return 'vendor-primevue-theme'
          }
          // PrimeVue componentes
          if (id.includes('node_modules/primevue')) {
            return 'vendor-primevue-ui'
          }
          // PrimeFlex + PrimeIcons (CSS utils)
          if (id.includes('primeflex') || id.includes('primeicons')) {
            return 'vendor-prime-utils'
          }
          // Vue core + Vue Router + Pinia
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vendor-vue'
          }
          // Axios
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios'
          }
        }
      }
    }
  }
})

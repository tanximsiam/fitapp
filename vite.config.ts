/// <reference types="vitest" />

import vue from '@vitejs/plugin-vue'
import path from 'path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Native webviews (Android System WebView, WKWebView) are evergreen, so no legacy bundle.
export default defineConfig({
  plugins: [tailwindcss(), vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: { host: true, port: 5174 },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})

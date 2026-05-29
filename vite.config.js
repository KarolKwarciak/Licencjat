import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // To mówi Vite: "Bezwzględnie weź te pliki z folderu public!"
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'], 
      manifest: {
        name: 'Fit App',
        short_name: 'FitApp',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png', // Ukośnik jest tu obowiązkowy
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png', // Ukośnik jest tu obowiązkowy
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
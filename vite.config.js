import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // <--- KLUCZOWA ZMIANA, kropka i ukośnik!
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'], 
      manifest: {
        name: 'Fit App',
        short_name: 'FitApp',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: './', // <--- usunięto /Licencjat/
        start_url: './', // <--- usunięto /Licencjat/
        icons: [
          {
            src: 'pwa-192x192.png', // <--- usunięto /Licencjat/
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png', // <--- usunięto /Licencjat/
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
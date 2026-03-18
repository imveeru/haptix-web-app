import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/haptix-web-app/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.youtube\.com\/iframe_api/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'youtube-iframe-api',
              expiration: { maxEntries: 1 },
            },
          },
          {
            urlPattern: /^https:\/\/img\.youtube\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'youtube-thumbnails',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            },
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ]
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Our own worker (src/sw.ts): the caches below plus new-episode notifications
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Lumo — Movies & TV',
        short_name: 'Lumo',
        description: 'Browse and watch trending movies and TV shows.',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Long-press the app icon (Android, Windows, macOS)
        shortcuts: [
          {
            name: 'Continue Watching',
            short_name: 'Continue',
            url: '/#continue-watching',
            icons: [{ src: 'shortcut-continue.png', sizes: '96x96', type: 'image/png' }],
          },
          { name: 'Search', url: '/search', icons: [{ src: 'shortcut-search.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'My List', url: '/my-list', icons: [{ src: 'shortcut-my-list.png', sizes: '96x96', type: 'image/png' }] },
        ],
      },
    }),
  ],
  server: { port: 3000 },
  define: { 'process.env': {} },
});

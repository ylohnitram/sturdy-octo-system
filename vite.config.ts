import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'logo.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-512x512-maskable.png',
          'apple-touch-icon.png',
          'apple-splash-*.png'
        ],
        devOptions: {
          enabled: true,
          type: 'module'
        },
        manifest: {
          name: 'Notch',
          short_name: 'Notch',
          description: 'Notch - Moderní dating aplikace pro odvážné lovce',
          theme_color: '#DC2626',
          background_color: '#000000',

          display: 'standalone',
          scope: '/',
          start_url: '/',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: 'apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [],
          // Force cache invalidation on version change
          navigateFallback: null,
          cacheId: `notch-v${process.env.npm_package_version}`
        }
      })
    ],
    define: {
      // Only expose key in development mode for local testing
      'process.env.GEMINI_API_KEY': mode === 'development'
        ? JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '')
        : JSON.stringify(''),
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(process.env.npm_package_version)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  esbuild: {
    pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info', 'console.warn'] : [],
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          supabase: ['@supabase/supabase-js'],
          tanstack: ['@tanstack/react-query'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: true,
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', '@tanstack/react-query'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        id: '/',
        name: 'LifeLink Sync - Emergency Protection & AI Safety Assistant',
        short_name: 'LifeLink Sync',
        description: 'AI-powered emergency protection with 24/7 monitoring, GPS tracking, and instant SOS alerts for families worldwide',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b0b0f',
        theme_color: '#ef4444',
        orientation: 'portrait' as any,
        lang: 'en',
        categories: ['health', 'safety', 'emergency', 'family'] as any,
        icons: [
          { src: '/lovable-uploads/lifelink-sync-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' as any },
          { src: '/lovable-uploads/lifelink-sync-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' as any }
        ],
        shortcuts: [
          {
            name: 'Emergency SOS',
            short_name: 'SOS',
            url: '/sos-app',
            icons: [{ src: '/lovable-uploads/lifelink-sync-icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Register',
            short_name: 'Register',
            url: '/ai-register',
            icons: [{ src: '/lovable-uploads/lifelink-sync-icon-192.png', sizes: '192x192' }]
          }
        ] as any,
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB to handle large bundles
        globIgnores: ['lovable-uploads/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/supabase/, /^\/tablet-dashboard$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/lovable-uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'optimized-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 }, // 90 days
              cacheableResponse: { statuses: [0, 200] },
              plugins: [{
                cacheKeyWillBeUsed: async ({ request }) => {
                  // Cache different sizes separately
                  return `${request.url}?optimized=true`;
                },
              }],
            },
          },
        ],
      },
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

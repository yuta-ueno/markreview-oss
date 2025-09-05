import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri expects a fixed port, failover to available one
  server: {
    port: 5173,
    strictPort: false,
  },
  // to access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: [
    'VITE_',
    'TAURI_PLATFORM',
    'TAURI_ARCH',
    'TAURI_FAMILY',
    'TAURI_PLATFORM_VERSION',
    'TAURI_PLATFORM_TYPE',
    'TAURI_DEBUG',
  ],
  build: {
    // Increase chunk size warning limit for large bundled modules
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: [
        '@tauri-apps/api/fs',
        '@tauri-apps/api/event',
      ],
      output: {
        // Manual chunk splitting for better caching and loading
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // CodeMirror editor libraries
          'editor-vendor': [
            '@codemirror/lang-markdown',
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands'
          ],
          // Markdown processing libraries
          'markdown-vendor': [
            'react-markdown',
            'remark-gfm',
            'rehype-highlight',
            'dompurify'
          ],
          // Tauri API chunk
          'tauri-vendor': [
            '@tauri-apps/plugin-dialog',
            '@tauri-apps/plugin-fs'
          ]
        },
        // Optimize chunk file naming
        chunkFileNames: () => {
          return `js/[name]-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || []
          let extType = info[info.length - 1] || ''
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img'
          } else if (/woff|woff2/.test(extType)) {
            extType = 'fonts'
          }
          return `${extType}/[name]-[hash][extname]`
        }
      }
    },
    // Enable minification and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Source maps for debugging
    sourcemap: false, // Disable in production for smaller bundles
    // Target modern browsers for smaller bundles
    target: 'es2020'
  },
  optimizeDeps: {
    exclude: ['@tauri-apps/api'],
  },
})

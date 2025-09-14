/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // OSS policy: never enable Pro in this repository
  define: {
    'import.meta.env.MARKREVIEW_PRO': JSON.stringify(false),
  },
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
      // Removed external modules - bundle Tauri APIs for proper module resolution
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
            '@tauri-apps/api',
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
        drop_console: false, // Keep console.log for debugging
        drop_debugger: false
      }
    },
    // Source maps for debugging
    sourcemap: false, // Disable in production for smaller bundles
    // Target modern browsers for smaller bundles
    target: 'es2020'
  },
  // Allow Tauri APIs to be optimized and bundled properly
})

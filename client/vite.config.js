import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname is not defined in ESM; recreate it for use in aliases
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Plugin to inject build timestamp for Safari cache-busting
const injectBuildTimestamp = () => {
  return {
    name: 'inject-build-timestamp',
    transformIndexHtml(html) {
      return html.replace('__BUILD_TIMESTAMP__', Date.now().toString())
    }
  }
}

// https://vitejs.dev/config/
// Build: Nov 20, 2025 - Enhanced frontend optimization with caching, code splitting, and performance improvements
export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for better dev experience
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic',
    }),
    injectBuildTimestamp()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Optimize chunk splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Heavy chart library - separate chunk
          'charts': ['recharts'],
          
          // Icons - separate chunk since they're large
          'icons': ['react-icons'],
          
          // Form handling
          'forms': ['react-hook-form', 'react-dropzone', 'react-image-crop'],
          
          // UI utilities
          'ui-utils': ['clsx', 'date-fns', 'react-colorful'],
          
          // State management and context
          'state': ['zustand', 'react-helmet-async'],
          
          // Toast notifications
          'toast': ['react-hot-toast'],
          
          // Payment integration
          'payment': ['flutterwave-react-v3'],
          
          // HTTP client
          'http': ['axios']
        },
        // Optimize asset file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId 
            ? chunkInfo.facadeModuleId.split('/').pop() 
            : 'chunk';
          return `assets/${chunkInfo.name}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Enable minification with optimized settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Multiple passes for better compression
      },
      mangle: {
        safari10: true, // Support Safari 10+
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 800, // Reduced from 1000
    
    // Compression
    reportCompressedSize: true,
    
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,
    
    // Target modern browsers for smaller bundles
    target: 'es2015',
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Asset inlining threshold (smaller assets will be inlined as base64)
    assetsInlineLimit: 4096, // 4kb
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})

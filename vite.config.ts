import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import FullReload from 'vite-plugin-full-reload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    RubyPlugin(),
    FullReload(['app/serializers/**/*.rb'], { delay: 200 }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/frontend'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    // swagger-ui-dist is lazy-loaded only on the /api-docs page and can't be
    // split further; raise the limit so the build doesn't warn on it.
    chunkSizeWarningLimit: 1600,
    // Tailwind v4 keeps custom @theme directives in the CSS pipeline.
    // Lightning CSS warns about that at-rule while minifying; esbuild
    // preserves it without emitting a false-positive warning.
    cssMinify: 'esbuild',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@inertiajs')) {
            return 'vendor-inertia'
          }
          if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/lucide-react')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/axios') || id.includes('node_modules/clsx') ||
              id.includes('node_modules/class-variance-authority') || id.includes('node_modules/date-fns')) {
            return 'vendor-common'
          }
        },
      },
    },
  },
})

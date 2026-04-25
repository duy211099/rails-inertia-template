import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'

export default defineConfig({
  server: {
    host: 'lvh.me',
    port: 3036,
  },
  plugins: [
    react(),
    tailwindcss(),
    RubyPlugin(),
  ],
})

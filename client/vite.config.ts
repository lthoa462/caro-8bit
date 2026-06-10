import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  preview: {
    host: true,
    allowedHosts: ['jigsaw-active-handwoven.ngrok-free.dev'] 
  },
  server: {
    host: true,
    allowedHosts: ['jigsaw-active-handwoven.ngrok-free.dev'] 
  },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ]
})

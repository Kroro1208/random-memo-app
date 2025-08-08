import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          // React 19 Compiler will be enabled when stable
          // ['babel-plugin-react-compiler', {}]
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@renderer': resolve(__dirname, 'src/renderer'),
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@prisma': resolve(__dirname, 'prisma')
    }
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron'],
      input: {
        main: resolve(__dirname, 'src/renderer/index.html')
      }
    },
    target: 'es2022'
  },
  server: {
    port: 5173,
    strictPort: true
  },
  base: './',
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development')
  }
});
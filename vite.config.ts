import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ProceduralPixelEngine',
      fileName: (format) => {
        const formats: Record<string, string> = {
          es: 'index.js',
          cjs: 'index.cjs',
          umd: 'index.umd.js',
          iife: 'index.iife.js'
        };
        return formats[format] || 'index.js';
      },
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: [
        'electron',
        'gl-matrix',
        'eventemitter3',
        'uuid',
        '@types/gl-matrix',
        '@types/uuid',
        '@types/node'
      ],
      output: {
        globals: {
          'gl-matrix': 'glMatrix',
          'eventemitter3': 'EventEmitter3',
          'uuid': 'UUID'
        }
      }
    },
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});

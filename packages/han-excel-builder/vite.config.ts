import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false, // Disable rollup to avoid issues with global types like Blob, File
      exclude: ['tests/**/*', 'examples/**/*'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/styles': resolve(__dirname, 'src/styles'),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'HanExcel',
      fileName: (format) => `han-excel.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['exceljs', 'file-saver', '@hannndler/core'],
      output: {
        globals: {
          exceljs: 'ExcelJS',
          'file-saver': 'saveAs',
          '@hannndler/core': 'HanCore',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2022',
  },
});


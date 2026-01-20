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
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'HanPDF',
      fileName: (format) => `han-pdf.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'pdfkit',
        '@han/core',
        'puppeteer',
        'pdf-lib',
        'pdfjs-dist',
        /^puppeteer/,
        /^@puppeteer/,
        /^node:/,
      ],
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
});


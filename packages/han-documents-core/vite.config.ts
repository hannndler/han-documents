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
      exclude: ['**/*.test.ts'],
      compilerOptions: {
        lib: ['ES2020', 'DOM', 'DOM.Iterable']
      }
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'HanDocumentsCore',
      fileName: (format) => {
        // Use .cjs extension for CommonJS format when package.json has "type": "module"
        if (format === 'cjs') {
          return 'han-core.cjs';
        }
        return `han-core.${format}.js`;
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2022',
  },
});


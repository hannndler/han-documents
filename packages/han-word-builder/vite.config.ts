import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'HanWord',
      fileName: (format) => {
        // Use .cjs extension for CommonJS format when package.json has "type": "module"
        if (format === 'cjs') {
          return 'han-word.cjs';
        }
        return `han-word.${format}.js`;
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['docx', '@han/core'],
      output: {
        exports: 'named',
      },
    },
    sourcemap: true,
    target: 'es2022',
  },
});


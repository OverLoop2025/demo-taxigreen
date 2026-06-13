import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

// Tests unitarios de LÓGICA PURA del conductor (sin React Native): guidance, etc.
// Acotado a `src/**` y entorno node para no arrastrar runtime nativo.
export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

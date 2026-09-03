import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Test della sola logica pura (`src/lib`): niente React Native, niente
 * database. Sono le funzioni dove un errore non si vede subito ma falsa
 * record e grafici per mesi.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});

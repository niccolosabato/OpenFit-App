import type { Config } from 'drizzle-kit';

/**
 * Genera le migrazioni SQL da `src/db/schema.ts`.
 *
 *   npm run db:generate
 *
 * Le migrazioni finiscono in `drizzle/` e vengono applicate all'avvio
 * dell'app da `src/app/_layout.tsx` (vedi `useMigrations`).
 */
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;

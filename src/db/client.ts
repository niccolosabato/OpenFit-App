import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'openfit.db';

/**
 * Handle SQLite grezzo.
 *
 * `enableChangeListener` è ciò che fa funzionare `useLiveQuery`: senza,
 * le schermate non si aggiornano quando si spunta una serie.
 */
export const sqlite = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

// WAL: letture e scritture non si bloccano a vicenda. Durante una sessione si
// scrive a ogni serie mentre le viste leggono di continuo.
sqlite.execSync('PRAGMA journal_mode = WAL;');
// Le foreign key in SQLite sono spente di default: senza questo, cancellare
// una scheda lascerebbe giorni ed esercizi orfani.
sqlite.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;

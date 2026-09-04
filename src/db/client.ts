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

/**
 * Esito dell'impostazione delle PRAGMA, per poterlo mostrare in diagnostica.
 * `null` = tutto a posto.
 */
export let pragmaError: string | null = null;

/**
 * Le PRAGMA girano all'importazione del modulo, cioè prima che React monti.
 * Se una lancia qui, si porta dietro l'intera catena di import e l'app resta
 * su uno splash muto senza dire perché: da qui il `try`. Sono ottimizzazioni
 * e garanzie, non requisiti — l'app funziona anche senza, solo peggio.
 */
try {
  // WAL: letture e scritture non si bloccano a vicenda. Durante una sessione
  // si scrive a ogni serie mentre le viste leggono di continuo.
  // Restituisce una riga con la modalità impostata, quindi si legge invece di
  // eseguirla e basta.
  sqlite.getFirstSync('PRAGMA journal_mode = WAL;');
  // Le foreign key in SQLite sono spente di default: senza questo, cancellare
  // una scheda lascerebbe giorni ed esercizi orfani.
  sqlite.execSync('PRAGMA foreign_keys = ON;');
} catch (error) {
  pragmaError = error instanceof Error ? error.message : String(error);
}

export const db = drizzle(sqlite, { schema });

export type DB = typeof db;

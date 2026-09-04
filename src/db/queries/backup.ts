/**
 * Backup completo in JSON.
 *
 * Senza account né sincronizzazione, questo è l'unico modo di conservare i
 * dati o spostarli su un altro telefono: disinstallare l'app li cancella tutti.
 *
 * Il dump è **grezzo**, tabella per tabella, letto e riscritto con SQL diretto
 * invece che attraverso Drizzle. Così i valori restano quelli memorizzati
 * (i timestamp sono interi, non `Date` serializzate) e il formato non cambia
 * se domani cambiano le mappature dell'ORM.
 */

import { db, sqlite } from '../client';
import { ensureSettings } from '../bootstrap';

export const BACKUP_FORMAT = 'openfit-backup';
export const BACKUP_VERSION = 1;

/**
 * Ordine di dipendenza: si inserisce in questa sequenza e si cancella
 * all'inverso, così le foreign key sono sempre soddisfatte.
 */
const TABLES = [
  'settings',
  'exercises',
  'routines',
  'routine_days',
  'routine_exercises',
  'routine_sets',
  'workout_sessions',
  'session_exercises',
  'session_sets',
  'personal_records',
  'body_measurements',
] as const;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  data: Record<string, Record<string, unknown>[]>;
};

export function exportBackup(): Backup {
  const data: Backup['data'] = {};
  for (const table of TABLES) {
    data[table] = sqlite.getAllSync<Record<string, unknown>>(`select * from ${table}`);
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export type BackupSummary = {
  exercises: number;
  routines: number;
  sessions: number;
  sets: number;
  measurements: number;
};

export function summarize(backup: Backup): BackupSummary {
  return {
    exercises: backup.data.exercises?.length ?? 0,
    routines: backup.data.routines?.length ?? 0,
    sessions: backup.data.workout_sessions?.length ?? 0,
    sets: backup.data.session_sets?.length ?? 0,
    measurements: backup.data.body_measurements?.length ?? 0,
  };
}

/**
 * Verifica che il file sia davvero un backup di OpenFit prima di toccare il
 * database. Un JSON qualsiasi importato alla cieca cancellerebbe tutto per poi
 * fallire a metà.
 */
export function parseBackup(raw: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Il file non è un JSON valido.');
  }

  const candidate = parsed as Partial<Backup>;
  if (candidate?.format !== BACKUP_FORMAT) {
    throw new Error('Questo file non è un backup di OpenFit.');
  }
  if (typeof candidate.version !== 'number' || candidate.version > BACKUP_VERSION) {
    throw new Error(
      'Il backup è stato creato con una versione più recente dell’app. Aggiorna OpenFit e riprova.',
    );
  }
  if (!candidate.data || typeof candidate.data !== 'object') {
    throw new Error('Il backup non contiene dati.');
  }

  return candidate as Backup;
}

/** Colonne realmente presenti nella tabella, per ignorare quelle di altre versioni. */
function columnsOf(table: string): Set<string> {
  const info = sqlite.getAllSync<{ name: string }>(`pragma table_info(${table})`);
  return new Set(info.map((c) => c.name));
}

/**
 * Sostituisce **tutto** il contenuto del database con quello del backup.
 *
 * Sostituzione e non fusione: gli id sono UUID generati su dispositivi diversi,
 * e fondere due storici produrrebbe doppioni silenziosi che nessuno andrebbe
 * poi a ripulire. Meglio un'operazione dichiarata e reversibile con un altro
 * export che una fusione approssimativa.
 */
export function restoreBackup(backup: Backup): void {
  sqlite.withTransactionSync(() => {
    for (const table of [...TABLES].reverse()) {
      sqlite.runSync(`delete from ${table}`);
    }

    for (const table of TABLES) {
      const rows = backup.data[table];
      if (!rows?.length) continue;

      const valid = columnsOf(table);

      for (const row of rows) {
        const columns = Object.keys(row).filter((c) => valid.has(c));
        if (columns.length === 0) continue;

        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map((c) => row[c] as never);

        sqlite.runSync(
          `insert into ${table} (${columns.map((c) => `"${c}"`).join(', ')}) values (${placeholders})`,
          values,
        );
      }
    }

    // Se il backup arrivasse senza `settings` — file troncato, versione più
    // vecchia del formato — l'app resterebbe senza la sua riga singleton.
    ensureSettings(db);
  });
}

/**
 * Svuota tutto e lascia il database pronto per essere riseminato all'avvio.
 *
 * `settings` è fra le tabelle cancellate, e la riga va ricreata subito: il
 * resto dell'app la dà per esistente, e il primo avvio si riconosce proprio dal
 * suo `onboardingCompleted` a `false`. Ricrearla qui — invece di aspettare il
 * prossimo `bootstrapDatabase` — significa che dopo "Cancella tutti i dati"
 * l'app riparte dalla presentazione, che è il comportamento voluto.
 */
export function wipeAllData(): void {
  sqlite.withTransactionSync(() => {
    for (const table of [...TABLES].reverse()) {
      sqlite.runSync(`delete from ${table}`);
    }
    ensureSettings(db);
  });
}

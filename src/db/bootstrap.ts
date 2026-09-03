/**
 * Preparazione del database dopo le migrazioni.
 *
 * Tutto qui dentro è **idempotente**: gira a ogni avvio dell'app e deve poter
 * essere rieseguito senza duplicare nulla né sovrascrivere dati dell'utente.
 *
 * Il driver `expo-sqlite` di Drizzle è sincrono, quindi si usa `.run()`,
 * `.get()` e `.all()` invece di `await`.
 */

import { inArray } from 'drizzle-orm';

import { DEFAULT_PLATE_INVENTORY } from '@/lib/plates';
import type { DB } from './client';
import { exercises, settings } from './schema';
import { SEED_EXERCISES } from './seed/exercises';

/** La riga di impostazioni è unica e ha sempre questo id. */
export const SETTINGS_ID = 1;

/**
 * Crea la riga di impostazioni al primo avvio. Se esiste già non la tocca:
 * i default dello schema valgono solo alla creazione.
 */
function ensureSettings(db: DB): void {
  db.insert(settings)
    .values({
      id: SETTINGS_ID,
      plateInventory: DEFAULT_PLATE_INVENTORY,
    })
    .onConflictDoNothing()
    .run();
}

/**
 * Allinea la libreria con il seed.
 *
 * Inserisce solo gli esercizi che mancano, riconoscendoli dallo slug. Gli
 * esercizi già presenti restano intatti — anche se l'utente li ha rinominati
 * o messi fra i preferiti — e quelli custom (UUID) non vengono mai sfiorati.
 * Così un aggiornamento dell'app può aggiungere esercizi nuovi senza rischi.
 */
function syncExerciseLibrary(db: DB): number {
  const seedIds = SEED_EXERCISES.map((e) => e.id);

  const existing = new Set(
    db
      .select({ id: exercises.id })
      .from(exercises)
      .where(inArray(exercises.id, seedIds))
      .all()
      .map((row) => row.id),
  );

  const missing = SEED_EXERCISES.filter((e) => !existing.has(e.id));
  if (missing.length === 0) return 0;

  db.insert(exercises)
    .values(
      missing.map((e) => ({
        id: e.id,
        name: e.name,
        aliases: e.aliases ?? null,
        primaryMuscle: e.primaryMuscle,
        secondaryMuscles: e.secondaryMuscles ?? [],
        equipment: e.equipment,
        mechanic: e.mechanic ?? 'isolation',
        trackingType: e.trackingType ?? 'weight_reps',
        isUnilateral: e.isUnilateral ?? false,
        isCustom: false,
        isFavorite: false,
        defaultRestSeconds: e.defaultRestSeconds ?? null,
      })),
    )
    .run();

  return missing.length;
}

/**
 * Da chiamare una volta sola all'avvio, dopo che le migrazioni sono passate.
 * Restituisce quanti esercizi ha aggiunto (0 a regime).
 */
export function bootstrapDatabase(db: DB): { seededExercises: number } {
  return db.transaction((tx) => {
    ensureSettings(tx as unknown as DB);
    const seededExercises = syncExerciseLibrary(tx as unknown as DB);
    return { seededExercises };
  });
}

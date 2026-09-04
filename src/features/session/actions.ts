/**
 * Azioni della sessione che vanno oltre la scrittura di una riga.
 *
 * Stanno qui e non in `db/queries/sessions.ts` perché mettono insieme cose di
 * livelli diversi — le serie e i record — e le query devono restare ignare
 * delle statistiche.
 */

import { deleteSession, discardSession, updateSessionSet } from '@/db/queries/sessions';
import type { SessionSet } from '@/db/schema';
import { applyRecords, rebuildRecords, type RecordHit } from '@/features/stats/records';

export type SetValues = {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  rir: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
};

/**
 * Spunta una serie: ne congela i valori, la marca come fatta e verifica
 * subito se ha battuto un record.
 *
 * La scrittura è immediata e non differita: se l'app muore a metà seduta, il
 * lavoro già fatto deve essere sul disco.
 */
export function completeSet(
  set: SessionSet,
  exerciseId: string,
  sessionId: string,
  values: SetValues,
): RecordHit[] {
  const completedAt = new Date();
  const updated: SessionSet = { ...set, ...values, isCompleted: true, completedAt };

  const hits = applyRecords(exerciseId, updated, sessionId);

  updateSessionSet(set.id, { ...values, isCompleted: true, completedAt, isPr: hits.length > 0 });

  return hits;
}

/** Toglie la spunta: la serie torna modificabile e smette di contare. */
export function uncompleteSet(setId: string): void {
  updateSessionSet(setId, { isCompleted: false, completedAt: null, isPr: false });
}

/**
 * Elimina una sessione dallo storico e riallinea i record.
 *
 * I due passaggi vanno insieme: senza il ricalcolo resterebbero primati
 * appesi a serie cancellate.
 */
export function removeSession(sessionId: string): void {
  deleteSession(sessionId);
  rebuildRecords();
}

/** Scarta la sessione in corso; se aveva già segnato record, li ritira. */
export function abandonSession(sessionId: string): void {
  discardSession(sessionId);
  rebuildRecords();
}

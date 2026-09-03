/**
 * Regole dei record, senza database.
 *
 * Sta in un modulo a parte da `records.ts` proprio per questo: decidere cosa
 * conta come record è la parte che vale la pena testare, e vive in isolamento
 * da SQLite.
 */

import { countsTowardVolume, type PrType, type SetType } from '@/db/enums';
import { estimate1RM } from '@/lib/e1rm';

export type RecordCandidate = {
  type: PrType;
  /** Numero di ripetizioni per `rep_max`, 0 per gli altri tipi. */
  reps: number;
  value: number;
};

/**
 * I record che una serie *potrebbe* battere: dice solo quanto vale la serie,
 * non se sia effettivamente un primato.
 *
 * Il riscaldamento non genera record — è il senso stesso di marcarlo come tale
 * — e un carico non positivo (corpo libero, assistito) non è confrontabile su
 * queste metriche.
 */
export function candidateRecords(
  weight: number | null,
  reps: number | null,
  setType: SetType,
): RecordCandidate[] {
  if (!countsTowardVolume(setType)) return [];
  if (weight === null || reps === null) return [];
  if (weight <= 0 || reps <= 0) return [];

  const candidates: RecordCandidate[] = [
    { type: 'best_weight', reps: 0, value: weight },
    { type: 'rep_max', reps, value: weight },
  ];

  const e1rm = estimate1RM(weight, reps);
  if (e1rm !== null) {
    candidates.push({ type: 'best_e1rm', reps: 0, value: e1rm });
  }

  return candidates;
}

/** Un pareggio non è un record: serve superare, non eguagliare. */
export function beatsRecord(candidate: number, previous: number | null | undefined): boolean {
  return previous === null || previous === undefined || candidate > previous;
}

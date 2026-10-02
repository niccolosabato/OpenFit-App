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

/**
 * Un record per ripetizioni vale solo se domina davvero la curva.
 *
 * La **prima** volta che si fanno N ripetizioni con un carico W non basta che
 * le N ripetizioni siano nuove: W deve essere almeno il massimo già sollevato
 * per N ripetizioni, e il confronto va fatto nei due versi.
 *
 * - Contro le ripetizioni **inferiori** già registrate: `W` deve essere almeno
 *   il loro carico, altrimenti è solo una serie più leggera con qualche
 *   ripetizione in più (un 90×6 dopo un 100×5 non è un primato).
 * - Contro le ripetizioni **superiori** già registrate: `W` deve essere
 *   *strettamente* maggiore, perché se hai già fatto 100×5 allora 100×4 non è
 *   niente di nuovo — ma 100×6 sì, sono più ripetizioni allo stesso carico.
 *
 * Senza il secondo verso, ogni calo di ripetizioni a parità di carico
 * produceva un "record a 4 ripetizioni" fasullo.
 */
export function qualifiesRepMax(
  weight: number,
  reps: number,
  repMaxes: { reps: number; value: number }[],
): boolean {
  return !repMaxes.some((r) => {
    if (r.reps === reps) return false;
    if (r.reps > reps) return r.value >= weight;
    return r.value > weight;
  });
}

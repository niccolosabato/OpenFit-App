/**
 * Volume esterno di una serie, in kg.
 *
 * La regola dipende da *come* l'esercizio si misura: un rematore muove il
 * carico, un piegamento muove il corpo. Per il corpo libero serve il peso
 * corporeo, che la sessione congela all'avvio (`workoutSessions.bodyweight`);
 * se manca, il volume a corpo libero resta zero invece di essere inventato.
 *
 * Sta in `lib/` perché è la stessa formula che devono usare sia la sessione in
 * corso sia le statistiche: due copie divergevano appena si toccava una.
 */

import { countsTowardVolume, type SetType, type TrackingType } from '@/db/enums';

export type VolumeInput = {
  setType: SetType;
  trackingType: TrackingType;
  /**
   * Carico esterno in kg. Per il corpo libero zavorrato è la zavorra; per
   * l'assistito è l'aiuto, negativo (vedi lo schema di `session_sets`).
   */
  weight: number | null;
  reps: number | null;
  /** Peso corporeo della seduta in kg; `null` se non lo si conosce. */
  bodyweight?: number | null;
};

export function setVolumeKg(input: VolumeInput): number {
  if (!countsTowardVolume(input.setType)) return 0;

  const reps = input.reps ?? 0;
  if (reps <= 0) return 0;

  const bodyweight = Math.max(0, input.bodyweight ?? 0);
  const load = input.weight ?? 0;

  switch (input.trackingType) {
    case 'bodyweight_reps':
      // Solo il corpo: senza sapere quanto pesa, non c'è volume da contare.
      return bodyweight * reps;

    case 'weighted_bodyweight':
      // Corpo più zavorra. La zavorra conta anche da sola, se il peso manca.
      return (bodyweight + Math.max(0, load)) * reps;

    case 'assisted_bodyweight':
      // L'assistenza alleggerisce: corpo meno aiuto, mai sotto zero.
      return Math.max(0, bodyweight + load) * reps;

    default:
      // `weight_reps` e affini: solo il carico esterno.
      return Math.max(0, load) * reps;
  }
}

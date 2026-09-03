/**
 * Riassunti testuali di una serie, prevista o eseguita.
 *
 * Stanno qui e non nei componenti perché la stessa stringa serve in tre posti
 * (builder, sessione, storico) e deve essere identica ovunque.
 */

import type { EffortScale, SetType, TrackingType, WeightUnit } from '@/db/enums';
import { usesDistance, usesDuration, usesReps, usesWeight } from '@/db/enums';
import { formatDuration } from './format';
import { formatWeight } from './units';

export type TargetLike = {
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  targetWeight: number | null;
  targetRpe: number | null;
  targetRir: number | null;
  targetDurationSeconds: number | null;
  targetDistanceMeters: number | null;
};

/** `8-10`, `5`, `45"`, `—`. */
export function formatTargetReps(target: TargetLike, tracking: TrackingType): string {
  if (usesDuration(tracking)) {
    return target.targetDurationSeconds ? formatDuration(target.targetDurationSeconds) : '—';
  }
  const { targetRepsMin: min, targetRepsMax: max } = target;
  if (min === null && max === null) return '—';
  if (min !== null && max !== null && min !== max) return `${min}-${max}`;
  return String(max ?? min);
}

/** `@8`, `2 RIR`, oppure stringa vuota se non c'è nulla da dire. */
export function formatEffort(
  target: { targetRpe: number | null; targetRir: number | null },
  scale: EffortScale,
): string {
  if (scale === 'rir' && target.targetRir !== null) return `${target.targetRir} RIR`;
  if (scale === 'rpe' && target.targetRpe !== null) return `@${target.targetRpe}`;
  // Se la scala preferita non è valorizzata si mostra l'altra invece di niente:
  // il dato c'è, tacerlo sarebbe peggio.
  if (target.targetRpe !== null) return `@${target.targetRpe}`;
  if (target.targetRir !== null) return `${target.targetRir} RIR`;
  return '';
}

/**
 * Riga completa di una serie prevista: `8-10 · @8 · 60 kg`.
 * Le parti assenti spariscono invece di lasciare separatori vuoti.
 */
export function describeRoutineSet(
  set: TargetLike,
  tracking: TrackingType,
  scale: EffortScale,
  unit: WeightUnit,
): string {
  const parts: string[] = [];

  if (usesReps(tracking) || usesDuration(tracking)) {
    parts.push(formatTargetReps(set, tracking));
  }
  if (usesDistance(tracking) && set.targetDistanceMeters) {
    parts.push(`${set.targetDistanceMeters} m`);
  }

  const effort = formatEffort(set, scale);
  if (effort) parts.push(effort);

  if (usesWeight(tracking) && set.targetWeight !== null) {
    parts.push(formatWeight(set.targetWeight, unit));
  }

  return parts.join(' · ') || '—';
}

/**
 * Etichetta della colonna di sinistra di una serie: il progressivo per le
 * serie allenanti, la sigla per tutte le altre (R, TOP, D, RP…).
 */
export function setLabel(setType: SetType, workingIndex: number, badge: string): string {
  return setType === 'working' ? String(workingIndex) : badge;
}

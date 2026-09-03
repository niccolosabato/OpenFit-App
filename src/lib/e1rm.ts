/**
 * Massimale stimato (e1RM).
 *
 * Serve a confrontare serie svolte con carichi e ripetizioni diversi:
 * 100×5 e 90×8 non sono comparabili a occhio, i rispettivi e1RM sì. È la
 * metrica su cui poggiano i grafici di progressione e il record `best_e1rm`.
 *
 * Sono stime, non massimali veri, e degradano oltre le ~12 ripetizioni:
 * per questo `estimate1RM` smette di rispondere sopra `MAX_REPS_FOR_ESTIMATE`
 * invece di restituire un numero inventato.
 */

export type E1rmFormula = 'epley' | 'brzycki';

/**
 * Oltre questa soglia la stima non è più informativa: la relazione
 * carico/ripetizioni si appiattisce e l'errore cresce troppo.
 */
export const MAX_REPS_FOR_ESTIMATE = 12;

/** Epley: 1RM = w × (1 + r/30). Tende a sovrastimare sulle ripetizioni alte. */
export function epley(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

/**
 * Brzycki: 1RM = w × 36 / (37 − r). Più conservativa di Epley,
 * ma diverge verso r = 37 e va quindi limitata.
 */
export function brzycki(weight: number, reps: number): number {
  if (reps >= 37) return NaN;
  return (weight * 36) / (37 - reps);
}

/**
 * Massimale stimato di una serie, o `null` se la serie non è stimabile
 * (carico o ripetizioni mancanti, carico non positivo, troppe ripetizioni).
 *
 * A una ripetizione non c'è nulla da stimare: il carico *è* il massimale.
 */
export function estimate1RM(
  weight: number | null | undefined,
  reps: number | null | undefined,
  formula: E1rmFormula = 'epley',
): number | null {
  if (weight === null || weight === undefined || reps === null || reps === undefined) return null;
  if (weight <= 0 || reps <= 0) return null;
  if (reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return weight;

  const value = formula === 'brzycki' ? brzycki(weight, reps) : epley(weight, reps);
  if (!Number.isFinite(value) || value <= 0) return null;
  return Number(value.toFixed(2));
}

/**
 * Percorso inverso: che carico serve per `reps` ripetizioni dato un e1RM.
 * È quello che alimenta i suggerimenti di carico ("per 3×8 metti 72,5 kg").
 */
export function weightForReps(
  oneRepMax: number,
  reps: number,
  formula: E1rmFormula = 'epley',
): number | null {
  if (oneRepMax <= 0 || reps <= 0 || reps > MAX_REPS_FOR_ESTIMATE) return null;
  if (reps === 1) return oneRepMax;

  const value = formula === 'brzycki' ? (oneRepMax * (37 - reps)) / 36 : oneRepMax / (1 + reps / 30);
  return Number(value.toFixed(2));
}

/**
 * Percentuale del massimale a cui è stata svolta una serie.
 * Utile per riconoscere una top set da una serie di scarico.
 */
export function intensityPercent(weight: number, oneRepMax: number): number | null {
  if (oneRepMax <= 0) return null;
  return Number(((weight / oneRepMax) * 100).toFixed(1));
}

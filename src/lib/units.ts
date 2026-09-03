/**
 * Unità di misura.
 *
 * Regola invariante: **nel database i carichi sono sempre in chilogrammi.**
 * L'unità scelta dall'utente è una preferenza di presentazione e vive solo al
 * bordo (input e output). Così cambiare unità non tocca lo storico e i backup
 * restano confrontabili.
 */

import type { WeightUnit } from '@/db/enums';

export const KG_PER_LB = 0.45359237;

/** Incremento minimo sensato per unità: mezzo chilo, una libbra. */
export const WEIGHT_STEP: Record<WeightUnit, number> = { kg: 0.5, lb: 1 };

export const UNIT_LABEL: Record<WeightUnit, string> = { kg: 'kg', lb: 'lb' };

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Da kg (database) all'unità mostrata. */
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Dall'unità digitata dall'utente a kg (database). */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Arrotonda al multiplo più vicino di `step`, evitando le code binarie. */
export function roundToIncrement(value: number, step: number): number {
  if (step <= 0) return value;
  return Number((Math.round(value / step) * step).toFixed(6));
}

/**
 * Numero pulito per la UI: niente `.0` inutili, mai più di due decimali.
 * `102.5` resta `102,5`, `100.0` diventa `100`, `102.4999` diventa `102,5`.
 */
export function formatNumber(value: number, maxDecimals = 2): string {
  const rounded = Number(value.toFixed(maxDecimals));
  return String(rounded);
}

/** Carico formattato nell'unità dell'utente, con simbolo. */
export function formatWeight(kg: number | null | undefined, unit: WeightUnit): string {
  if (kg === null || kg === undefined) return '—';
  return `${formatNumber(fromKg(kg, unit), 2)} ${UNIT_LABEL[unit]}`;
}

/** Come `formatWeight` ma senza simbolo, per le celle di una tabella. */
export function formatWeightValue(kg: number | null | undefined, unit: WeightUnit): string {
  if (kg === null || kg === undefined) return '';
  return formatNumber(fromKg(kg, unit), 2);
}

/**
 * Volume totale: i numeri diventano grandi in fretta, oltre le 10 tonnellate
 * le cifre singole non dicono più nulla.
 */
export function formatVolume(kg: number, unit: WeightUnit): string {
  const value = fromKg(kg, unit);
  if (value >= 10_000) return `${formatNumber(value / 1000, 1)} t`;
  return `${formatNumber(Math.round(value))} ${UNIT_LABEL[unit]}`;
}

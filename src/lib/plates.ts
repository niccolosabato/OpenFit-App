/**
 * Calcolatore dei dischi.
 *
 * Risponde alla domanda che ci si fa davanti al rack: *per 102,5 kg, cosa
 * carico per lato?* Ragiona sempre **per lato** — il bilanciere è simmetrico,
 * quindi il carico da distribuire è `(target − bilanciere) / 2`.
 *
 * I calcoli sono in chilogrammi, come tutto il resto del database.
 */

import type { PlateSpec } from '@/db/schema';

/** Dotazione tipica di una palestra commerciale italiana, per lato. */
export const DEFAULT_PLATE_INVENTORY: PlateSpec[] = [
  { weight: 25, count: 4 },
  { weight: 20, count: 4 },
  { weight: 15, count: 2 },
  { weight: 10, count: 2 },
  { weight: 5, count: 2 },
  { weight: 2.5, count: 2 },
  { weight: 1.25, count: 2 },
];

export const DEFAULT_BAR_WEIGHT = 20;

export type PlateBreakdown = {
  /** Dischi da mettere su **un** lato, dal più pesante al più leggero. */
  perSide: PlateSpec[];
  /** Peso totale realmente ottenibile con questi dischi. */
  achieved: number;
  /** Quanto manca al target; > 0 se i dischi non bastano. */
  remainder: number;
  /** Il target non è raggiungibile esattamente con la dotazione dichiarata. */
  isExact: boolean;
  /** Il target è sotto il peso del solo bilanciere. */
  belowBar: boolean;
};

/**
 * Scompone `target` nei dischi da caricare per lato.
 *
 * Strategia greedy dal disco più pesante: con una dotazione a scaglioni
 * standard (25/20/15/10/5/2.5/1.25) coincide con la soluzione a meno dischi,
 * ed è anche il modo in cui si carica davvero un bilanciere.
 */
export function calculatePlates(
  target: number,
  barWeight: number = DEFAULT_BAR_WEIGHT,
  inventory: PlateSpec[] = DEFAULT_PLATE_INVENTORY,
): PlateBreakdown {
  if (target < barWeight) {
    return { perSide: [], achieved: barWeight, remainder: 0, isExact: target === barWeight, belowBar: true };
  }

  let perSideTarget = (target - barWeight) / 2;

  const available = inventory
    .filter((p) => p.weight > 0 && p.count > 0)
    .sort((a, b) => b.weight - a.weight);

  const perSide: PlateSpec[] = [];

  for (const plate of available) {
    // Tolleranza per l'aritmetica in virgola mobile: senza, 1.25 × 3 non
    // rientra mai esattamente in 3.75.
    const usable = Math.min(plate.count, Math.floor((perSideTarget + 1e-9) / plate.weight));
    if (usable > 0) {
      perSide.push({ weight: plate.weight, count: usable });
      perSideTarget -= usable * plate.weight;
    }
  }

  const loadedPerSide = perSide.reduce((sum, p) => sum + p.weight * p.count, 0);
  const achieved = Number((barWeight + loadedPerSide * 2).toFixed(3));
  const remainder = Number((target - achieved).toFixed(3));

  return {
    perSide,
    achieved,
    remainder,
    isExact: Math.abs(remainder) < 1e-6,
    belowBar: false,
  };
}

/** "25 + 20 + 5 + 2,5" — i dischi di un lato in riga. */
export function formatPlateBreakdown(perSide: PlateSpec[]): string {
  if (perSide.length === 0) return 'solo bilanciere';
  return perSide
    .flatMap((p) => Array<number>(p.count).fill(p.weight))
    .map((w) => String(w).replace('.', ','))
    .join(' + ');
}

/**
 * Il peso caricabile più vicino al target, verso il basso e verso l'alto.
 * Serve quando il target non è esatto: l'app propone l'alternativa fattibile
 * invece di lasciare l'utente con un numero che non può mettere sul bilanciere.
 */
export function nearestLoadable(
  target: number,
  barWeight: number = DEFAULT_BAR_WEIGHT,
  inventory: PlateSpec[] = DEFAULT_PLATE_INVENTORY,
): { below: number; above: number | null } {
  const below = calculatePlates(target, barWeight, inventory).achieved;
  if (Math.abs(below - target) < 1e-6) return { below, above: below };

  // Il passo più fine ottenibile è il doppio del disco più leggero (uno per lato).
  const lightest = inventory
    .filter((p) => p.weight > 0 && p.count > 0)
    .reduce((min, p) => Math.min(min, p.weight), Infinity);
  if (!Number.isFinite(lightest)) return { below, above: null };

  const candidate = calculatePlates(below + lightest * 2, barWeight, inventory);
  return { below, above: candidate.achieved > below ? candidate.achieved : null };
}

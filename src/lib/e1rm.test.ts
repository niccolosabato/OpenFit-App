import { describe, expect, it } from 'vitest';

import { estimate1RM, intensityPercent, MAX_REPS_FOR_ESTIMATE, weightForReps } from './e1rm';

describe('estimate1RM', () => {
  it('a una ripetizione il carico è il massimale', () => {
    expect(estimate1RM(140, 1)).toBe(140);
    expect(estimate1RM(140, 1, 'brzycki')).toBe(140);
  });

  it('applica la formula di Epley', () => {
    // 100 × (1 + 5/30) = 116.67
    expect(estimate1RM(100, 5)).toBeCloseTo(116.67, 1);
  });

  it('applica la formula di Brzycki', () => {
    // 100 × 36 / (37 − 5) = 112.5
    expect(estimate1RM(100, 5, 'brzycki')).toBeCloseTo(112.5, 1);
  });

  it('Brzycki è più conservativa di Epley sotto le 10 ripetizioni', () => {
    for (const reps of [3, 5, 8]) {
      expect(estimate1RM(100, reps, 'brzycki')!).toBeLessThan(estimate1RM(100, reps)!);
    }
  });

  it('le due formule coincidono esattamente a 10 ripetizioni', () => {
    // 100 × (1 + 10/30) = 100 × 36/27 = 133.33: è il punto in cui si incrociano,
    // sopra il quale Brzycki diventa la più generosa delle due.
    expect(estimate1RM(100, 10, 'brzycki')).toBe(estimate1RM(100, 10));
    expect(estimate1RM(100, 12, 'brzycki')!).toBeGreaterThan(estimate1RM(100, 12)!);
  });

  it('non stima oltre il limite di ripetizioni', () => {
    expect(estimate1RM(60, MAX_REPS_FOR_ESTIMATE)).not.toBeNull();
    expect(estimate1RM(60, MAX_REPS_FOR_ESTIMATE + 1)).toBeNull();
  });

  it('rifiuta serie non stimabili invece di inventare un numero', () => {
    expect(estimate1RM(null, 5)).toBeNull();
    expect(estimate1RM(100, null)).toBeNull();
    expect(estimate1RM(0, 5)).toBeNull();
    expect(estimate1RM(100, 0)).toBeNull();
    // Corpo libero assistito: il carico è negativo, non è un massimale.
    expect(estimate1RM(-15, 8)).toBeNull();
  });

  it('cresce al crescere delle ripetizioni a parità di carico', () => {
    const values = [1, 3, 5, 8, 10].map((r) => estimate1RM(100, r)!);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});

describe('weightForReps', () => {
  it('è l’inverso di estimate1RM', () => {
    const oneRm = estimate1RM(100, 5)!;
    expect(weightForReps(oneRm, 5)).toBeCloseTo(100, 1);
  });

  it('vale anche per Brzycki', () => {
    const oneRm = estimate1RM(100, 8, 'brzycki')!;
    expect(weightForReps(oneRm, 8, 'brzycki')).toBeCloseTo(100, 1);
  });

  it('a una ripetizione restituisce il massimale', () => {
    expect(weightForReps(150, 1)).toBe(150);
  });

  it('rifiuta richieste fuori range', () => {
    expect(weightForReps(150, 0)).toBeNull();
    expect(weightForReps(0, 5)).toBeNull();
    expect(weightForReps(150, MAX_REPS_FOR_ESTIMATE + 1)).toBeNull();
  });
});

describe('intensityPercent', () => {
  it('calcola la percentuale del massimale', () => {
    expect(intensityPercent(80, 100)).toBe(80);
  });

  it('non divide per zero', () => {
    expect(intensityPercent(80, 0)).toBeNull();
  });
});

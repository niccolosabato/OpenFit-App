import { describe, expect, it } from 'vitest';

import { candidateRecords } from './record-rules';

describe('candidateRecords', () => {
  it('propone carico massimo, e1RM e record di ripetizioni', () => {
    const candidates = candidateRecords(100, 5, 'working');
    expect(candidates.map((c) => c.type).sort()).toEqual(['best_e1rm', 'best_weight', 'rep_max']);

    const repMax = candidates.find((c) => c.type === 'rep_max')!;
    expect(repMax.reps).toBe(5);
    expect(repMax.value).toBe(100);
  });

  it('usa 0 come chiave per i record non legati alle ripetizioni', () => {
    const candidates = candidateRecords(100, 5, 'working');
    expect(candidates.find((c) => c.type === 'best_weight')!.reps).toBe(0);
    expect(candidates.find((c) => c.type === 'best_e1rm')!.reps).toBe(0);
  });

  it('il riscaldamento non genera record', () => {
    expect(candidateRecords(100, 5, 'warmup')).toEqual([]);
  });

  it('i segmenti di una serie estesa contano comunque', () => {
    // Uno scalino di stripping può benissimo essere un record di ripetizioni
    // a quel carico: non c'è motivo di ignorarlo.
    expect(candidateRecords(80, 8, 'drop').length).toBeGreaterThan(0);
    expect(candidateRecords(100, 3, 'rest_pause').length).toBeGreaterThan(0);
  });

  it('non propone nulla senza carico o ripetizioni', () => {
    expect(candidateRecords(null, 5, 'working')).toEqual([]);
    expect(candidateRecords(100, null, 'working')).toEqual([]);
    expect(candidateRecords(0, 5, 'working')).toEqual([]);
    expect(candidateRecords(100, 0, 'working')).toEqual([]);
  });

  it('ignora il corpo libero assistito, che ha carico negativo', () => {
    expect(candidateRecords(-15, 8, 'working')).toEqual([]);
  });

  it('salta l’e1RM quando le ripetizioni sono troppe per stimarlo', () => {
    const candidates = candidateRecords(60, 20, 'working');
    expect(candidates.map((c) => c.type)).not.toContain('best_e1rm');
    // Carico massimo e record a 20 ripetizioni restano validi.
    expect(candidates.map((c) => c.type).sort()).toEqual(['best_weight', 'rep_max']);
  });
});

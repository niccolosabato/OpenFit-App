import { describe, expect, it } from 'vitest';

import { formatNumber, formatVolume, formatWeight, fromKg, roundToIncrement, toKg } from './units';

describe('conversione', () => {
  it('kg resta kg', () => {
    expect(fromKg(100, 'kg')).toBe(100);
    expect(toKg(100, 'kg')).toBe(100);
  });

  it('converte in libbre e torna indietro senza perdita percettibile', () => {
    expect(fromKg(100, 'lb')).toBeCloseTo(220.462, 3);
    expect(toKg(fromKg(102.5, 'lb'), 'lb')).toBeCloseTo(102.5, 6);
  });
});

describe('roundToIncrement', () => {
  it('arrotonda al mezzo chilo', () => {
    expect(roundToIncrement(102.4, 0.5)).toBe(102.5);
    expect(roundToIncrement(102.2, 0.5)).toBe(102);
  });

  it('non introduce code binarie', () => {
    // 0.1 + 0.2 style: il risultato deve essere un numero pulito.
    expect(roundToIncrement(2.675, 0.05)).toBe(2.7);
  });

  it('lascia il valore intatto se il passo non è valido', () => {
    expect(roundToIncrement(37.3, 0)).toBe(37.3);
  });
});

describe('formattazione', () => {
  it('toglie gli zeri decimali inutili', () => {
    expect(formatNumber(100)).toBe('100');
    expect(formatNumber(102.5)).toBe('102.5');
    expect(formatNumber(102.4999)).toBe('102.5');
  });

  it('mostra un trattino quando il carico non c’è', () => {
    expect(formatWeight(null, 'kg')).toBe('—');
    expect(formatWeight(undefined, 'kg')).toBe('—');
  });

  it('formatta il carico con l’unità', () => {
    expect(formatWeight(102.5, 'kg')).toBe('102.5 kg');
  });

  it('passa alle tonnellate quando il volume diventa illeggibile', () => {
    expect(formatVolume(4500, 'kg')).toBe('4500 kg');
    expect(formatVolume(12500, 'kg')).toBe('12.5 t');
  });
});

import { describe, expect, it } from 'vitest';

import {
  calculatePlates,
  DEFAULT_BAR_WEIGHT,
  DEFAULT_PLATE_INVENTORY,
  formatPlateBreakdown,
  nearestLoadable,
} from './plates';

describe('calculatePlates', () => {
  it('carica un peso tondo con i dischi più pesanti disponibili', () => {
    const result = calculatePlates(100);
    expect(result.isExact).toBe(true);
    expect(result.achieved).toBe(100);
    // (100 − 20) / 2 = 40 per lato → 25 + 15
    expect(result.perSide).toEqual([
      { weight: 25, count: 1 },
      { weight: 15, count: 1 },
    ]);
  });

  it('gestisce i mezzi chili senza code in virgola mobile', () => {
    // Il caso classico: 102.5 kg richiede un 1.25 per lato, che in floating
    // point non rientra mai esattamente se non si tollera l'errore.
    const result = calculatePlates(102.5);
    expect(result.isExact).toBe(true);
    expect(result.achieved).toBe(102.5);
    expect(result.perSide).toEqual([
      { weight: 25, count: 1 },
      { weight: 15, count: 1 },
      { weight: 1.25, count: 1 },
    ]);
  });

  it('somma più dischi uguali quando servono', () => {
    const result = calculatePlates(160);
    // (160 − 20) / 2 = 70 per lato → 25 + 25 + 20
    expect(result.perSide).toEqual([
      { weight: 25, count: 2 },
      { weight: 20, count: 1 },
    ]);
    expect(result.achieved).toBe(160);
  });

  it('con il peso esatto del bilanciere non chiede dischi', () => {
    const result = calculatePlates(20);
    expect(result.perSide).toEqual([]);
    expect(result.isExact).toBe(true);
    // `belowBar` segnala un target *irraggiungibile*: a 20 kg netti il
    // bilanciere scarico va benissimo, quindi resta false.
    expect(result.belowBar).toBe(false);
  });

  it('segnala un target sotto il peso del bilanciere', () => {
    const result = calculatePlates(15);
    expect(result.belowBar).toBe(true);
    expect(result.isExact).toBe(false);
    expect(result.achieved).toBe(DEFAULT_BAR_WEIGHT);
  });

  it('si ferma al massimo caricabile se i dischi finiscono', () => {
    const scarce = [{ weight: 20, count: 1 }];
    const result = calculatePlates(200, 20, scarce);
    expect(result.achieved).toBe(60);
    expect(result.remainder).toBe(140);
    expect(result.isExact).toBe(false);
  });

  it('rispetta un bilanciere non standard', () => {
    // Trap bar da 25 kg: 75 kg totali = 25 per lato.
    const result = calculatePlates(75, 25);
    expect(result.perSide).toEqual([{ weight: 25, count: 1 }]);
    expect(result.isExact).toBe(true);
  });

  it('non è mai esatto per un target dispari non caricabile', () => {
    const result = calculatePlates(101);
    expect(result.isExact).toBe(false);
    expect(result.achieved).toBeLessThan(101);
  });
});

describe('nearestLoadable', () => {
  it('restituisce lo stesso valore se il target è già caricabile', () => {
    expect(nearestLoadable(100)).toEqual({ below: 100, above: 100 });
  });

  it('propone il caricabile sotto e sopra un target impossibile', () => {
    const { below, above } = nearestLoadable(101);
    expect(below).toBe(100);
    // Il passo minimo è 1.25 per lato = 2.5 kg totali.
    expect(above).toBe(102.5);
  });

  it('non propone un valore superiore se i dischi sono esauriti', () => {
    const scarce = [{ weight: 20, count: 1 }];
    expect(nearestLoadable(200, 20, scarce).above).toBeNull();
  });
});

describe('formatPlateBreakdown', () => {
  it('elenca ogni disco singolarmente, con la virgola decimale', () => {
    expect(formatPlateBreakdown([{ weight: 25, count: 2 }, { weight: 1.25, count: 1 }])).toBe(
      '25 + 25 + 1,25',
    );
  });

  it('dice esplicitamente quando non c’è nulla da caricare', () => {
    expect(formatPlateBreakdown([])).toBe('solo bilanciere');
  });
});

describe('dotazione predefinita', () => {
  it('copre tutti i mezzi chili fino al massimo caricabile', () => {
    const max = DEFAULT_PLATE_INVENTORY.reduce((sum, p) => sum + p.weight * p.count * 2, 0) + 20;
    for (let target = 20; target <= max; target += 2.5) {
      expect(calculatePlates(target).isExact).toBe(true);
    }
  });
});

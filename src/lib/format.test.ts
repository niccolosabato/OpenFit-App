import { describe, expect, it } from 'vitest';

import { formatDuration, formatDurationLong, formatRest, pluralize } from './format';

describe('formatDuration', () => {
  it('formatta minuti e secondi', () => {
    expect(formatDuration(90)).toBe('1:30');
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(0)).toBe('0:00');
  });

  it('aggiunge le ore quando servono', () => {
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('non va sotto zero se il timer sfora', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });
});

describe('formatDurationLong', () => {
  it('usa ore e minuti per le sessioni', () => {
    expect(formatDurationLong(4320)).toBe('1h 12min');
    expect(formatDurationLong(3600)).toBe('1h');
    expect(formatDurationLong(2880)).toBe('48min');
    expect(formatDurationLong(30)).toBe('30s');
  });
});

describe('formatRest', () => {
  it('scrive i recuperi come si scrivono in una scheda', () => {
    expect(formatRest(45)).toBe('45"');
    expect(formatRest(120)).toBe("2'");
    expect(formatRest(150)).toBe("2'30\"");
  });
});

describe('pluralize', () => {
  it('accorda il sostantivo', () => {
    expect(pluralize(1, 'serie', 'serie')).toBe('1 serie');
    expect(pluralize(3, 'esercizio', 'esercizi')).toBe('3 esercizi');
  });
});

import { describe, expect, it } from 'vitest';

import type { Muscle, SetType } from '@/db/enums';
import {
  SECONDARY_SET_WEIGHT,
  bucketByWeek,
  progressionBySession,
  setCountsByGroup,
  volumeOf,
  weeklyStreak,
  type StatSet,
} from './aggregate';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Lunedì 5 gennaio 2026, mezzogiorno. */
const MONDAY = new Date('2026-01-05T12:00:00Z').getTime();

function makeSet(overrides: Partial<StatSet> = {}): StatSet {
  return {
    sessionId: 's1',
    startedAt: MONDAY,
    exerciseId: 'e1',
    primaryMuscle: 'chest' as Muscle,
    secondaryMuscles: [],
    setType: 'working' as SetType,
    parentSetId: null,
    weight: 100,
    reps: 8,
    ...overrides,
  };
}

describe('setCountsByGroup', () => {
  it('conta una serie piena sul gruppo del muscolo principale', () => {
    const counts = setCountsByGroup([makeSet(), makeSet()]);
    expect(counts.chest).toBe(2);
  });

  it('conta i muscoli secondari a metà', () => {
    const counts = setCountsByGroup([
      makeSet({ primaryMuscle: 'lats', secondaryMuscles: ['biceps'] }),
    ]);
    expect(counts.back).toBe(1);
    expect(counts.arms).toBe(SECONDARY_SET_WEIGHT);
  });

  it('non conta due volte lo stesso gruppo fra i secondari', () => {
    // Dorsali e trapezi stanno entrambi in "Schiena": la serie non deve valere
    // due mezze serie sullo stesso gruppo.
    const counts = setCountsByGroup([
      makeSet({ primaryMuscle: 'rear_delts', secondaryMuscles: ['lats', 'traps'] }),
    ]);
    expect(counts.back).toBe(SECONDARY_SET_WEIGHT);
  });

  it('non somma il secondario quando ricade nel gruppo del principale', () => {
    const counts = setCountsByGroup([
      makeSet({ primaryMuscle: 'lats', secondaryMuscles: ['traps'] }),
    ]);
    expect(counts.back).toBe(1);
  });

  it('esclude il riscaldamento', () => {
    expect(setCountsByGroup([makeSet({ setType: 'warmup' })]).chest).toBe(0);
  });

  it('uno stripping resta una serie sola', () => {
    const parent = makeSet();
    const drop = makeSet({ setType: 'drop', parentSetId: 'padre', weight: 80, reps: 5 });
    expect(setCountsByGroup([parent, drop]).chest).toBe(1);
  });
});

describe('volumeOf', () => {
  it('moltiplica carico e ripetizioni', () => {
    expect(volumeOf(makeSet({ weight: 100, reps: 8 }))).toBe(800);
  });

  it('i segmenti di una serie estesa portano il loro volume', () => {
    expect(volumeOf(makeSet({ setType: 'drop', weight: 80, reps: 5 }))).toBe(400);
  });

  it('il riscaldamento non fa volume', () => {
    expect(volumeOf(makeSet({ setType: 'warmup' }))).toBe(0);
  });

  it('carico assente o non positivo non fa volume', () => {
    expect(volumeOf(makeSet({ weight: null }))).toBe(0);
    expect(volumeOf(makeSet({ weight: -15 }))).toBe(0);
    expect(volumeOf(makeSet({ reps: null }))).toBe(0);
  });
});

describe('bucketByWeek', () => {
  const options = { weeks: 4, now: MONDAY + 3 * 24 * 60 * 60 * 1000, firstDayOfWeek: 1 };

  it('restituisce anche le settimane senza allenamenti', () => {
    const buckets = bucketByWeek([makeSet()], options);
    expect(buckets).toHaveLength(4);
    expect(buckets.filter((b) => b.sessionIds.size === 0)).toHaveLength(3);
  });

  it('mette ogni serie nella sua settimana', () => {
    const buckets = bucketByWeek(
      [makeSet(), makeSet({ sessionId: 's2', startedAt: MONDAY - WEEK_MS })],
      options,
    );
    expect(buckets[buckets.length - 1].sets).toBe(1);
    expect(buckets[buckets.length - 2].sets).toBe(1);
  });

  it('scarta quello che cade prima del periodo', () => {
    const buckets = bucketByWeek([makeSet({ startedAt: MONDAY - 10 * WEEK_MS })], options);
    expect(buckets.every((b) => b.sets === 0)).toBe(true);
  });

  it('conta le sessioni distinte, non le serie', () => {
    const buckets = bucketByWeek([makeSet(), makeSet(), makeSet({ sessionId: 's2' })], options);
    expect(buckets[buckets.length - 1].sessionIds.size).toBe(2);
    expect(buckets[buckets.length - 1].sets).toBe(3);
  });

  it('le settimane escono in ordine cronologico', () => {
    const buckets = bucketByWeek([], options);
    for (let i = 1; i < buckets.length; i++) {
      expect(buckets[i].weekStart).toBeGreaterThan(buckets[i - 1].weekStart);
    }
  });
});

describe('progressionBySession', () => {
  it('produce un punto per sessione, in ordine di data', () => {
    const summaries = progressionBySession([
      makeSet({ sessionId: 's2', startedAt: MONDAY + WEEK_MS, weight: 105 }),
      makeSet({ sessionId: 's1', startedAt: MONDAY, weight: 100 }),
    ]);
    expect(summaries.map((s) => s.sessionId)).toEqual(['s1', 's2']);
  });

  it('tiene il carico più alto e il miglior massimale stimato della seduta', () => {
    const [summary] = progressionBySession([
      makeSet({ weight: 100, reps: 8 }),
      makeSet({ weight: 110, reps: 3 }),
    ]);
    expect(summary.topWeight).toBe(110);
    // 100×8 stima più di 110×3: il massimale non segue il carico più pesante.
    expect(summary.bestE1rm).toBeCloseTo(126.67, 1);
  });

  it('somma il volume di tutta la seduta, segmenti inclusi', () => {
    const [summary] = progressionBySession([
      makeSet({ weight: 100, reps: 8 }),
      makeSet({ setType: 'drop', parentSetId: 'p', weight: 80, reps: 5 }),
    ]);
    expect(summary.volume).toBe(800 + 400);
    expect(summary.sets).toBe(1);
  });

  it('ignora le sedute in cui l’esercizio è stato solo riscaldamento', () => {
    expect(progressionBySession([makeSet({ setType: 'warmup' })])).toEqual([]);
  });
});

describe('weeklyStreak', () => {
  const bucket = (weekStart: number, sessions: string[]) => ({
    weekStart,
    volume: 0,
    sets: 0,
    sessionIds: new Set(sessions),
  });

  it('conta le settimane attive consecutive', () => {
    expect(
      weeklyStreak([
        bucket(1, []),
        bucket(2, ['a']),
        bucket(3, ['b']),
        bucket(4, ['c']),
      ]),
    ).toBe(3);
  });

  it('una settimana in corso ancora vuota non spezza la serie', () => {
    expect(weeklyStreak([bucket(1, ['a']), bucket(2, ['b']), bucket(3, [])])).toBe(2);
  });

  it('un buco a metà interrompe', () => {
    expect(weeklyStreak([bucket(1, ['a']), bucket(2, []), bucket(3, ['c'])])).toBe(1);
  });

  it('senza allenamenti la serie è zero', () => {
    expect(weeklyStreak([bucket(1, []), bucket(2, [])])).toBe(0);
  });
});

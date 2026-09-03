/**
 * Aggregazioni per le statistiche.
 *
 * Funzioni pure su righe già lette dal database: nessun accesso a SQLite, così
 * le regole di conteggio — quelle che decidono cosa significano i numeri
 * mostrati — si possono testare davvero.
 */

import { startOfWeek } from 'date-fns';

import {
  MUSCLE_TO_GROUP,
  countsAsWorkingSet,
  countsTowardVolume,
  type Muscle,
  type MuscleGroup,
  type SetType,
} from '@/db/enums';
import { estimate1RM } from '@/lib/e1rm';

/** Una serie completata, appiattita con quel che serve alle statistiche. */
export type StatSet = {
  sessionId: string;
  /** Inizio della sessione, epoch ms. */
  startedAt: number;
  exerciseId: string;
  primaryMuscle: Muscle;
  secondaryMuscles: Muscle[];
  setType: SetType;
  parentSetId: string | null;
  weight: number | null;
  reps: number | null;
};

/**
 * Quanto conta una serie per un muscolo secondario.
 *
 * Un rematore allena i bicipiti, ma non come un curl. Contarlo pieno gonfia il
 * volume delle braccia, ignorarlo lo sottostima: mezza serie è la convenzione
 * diffusa e resta onesta.
 */
export const SECONDARY_SET_WEIGHT = 0.5;

/**
 * Serie allenanti per gruppo muscolare — la metrica che conta davvero per
 * l'ipertrofia, molto più del tonnellaggio.
 *
 * Si contano solo le serie di primo livello non di riscaldamento: uno
 * stripping resta una serie, per quanti scalini abbia.
 */
export function setCountsByGroup(sets: StatSet[]): Record<MuscleGroup, number> {
  const counts = {
    chest: 0,
    back: 0,
    shoulders: 0,
    arms: 0,
    legs: 0,
    core: 0,
    other: 0,
  } satisfies Record<MuscleGroup, number>;

  for (const set of sets) {
    if (set.parentSetId !== null) continue;
    if (!countsAsWorkingSet(set.setType)) continue;

    counts[MUSCLE_TO_GROUP[set.primaryMuscle]] += 1;

    // Un esercizio può avere due secondari nello stesso gruppo (tricipiti e
    // deltoide anteriore sono gruppi diversi, ma dorsali e trapezi no): il
    // gruppo va contato una volta sola.
    const secondaryGroups = new Set(set.secondaryMuscles.map((m) => MUSCLE_TO_GROUP[m]));
    secondaryGroups.delete(MUSCLE_TO_GROUP[set.primaryMuscle]);
    for (const group of secondaryGroups) {
      counts[group] += SECONDARY_SET_WEIGHT;
    }
  }

  return counts;
}

/** Volume esterno di una serie: carico × ripetizioni, 0 se non è misurabile. */
export function volumeOf(set: StatSet): number {
  if (!countsTowardVolume(set.setType)) return 0;
  const weight = set.weight ?? 0;
  const reps = set.reps ?? 0;
  if (weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

export type WeekBucket = {
  /** Mezzanotte del primo giorno della settimana, epoch ms. */
  weekStart: number;
  volume: number;
  sets: number;
  sessionIds: Set<string>;
};

/**
 * Raggruppa per settimana, restituendo **tutte** le settimane del periodo,
 * comprese quelle vuote: un buco nel grafico è un'informazione, saltarlo
 * farebbe sembrare continuo un allenamento che non lo è stato.
 */
export function bucketByWeek(
  sets: StatSet[],
  options: { weeks: number; now: number; firstDayOfWeek: number },
): WeekBucket[] {
  const weekStartsOn = (options.firstDayOfWeek % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const currentWeekStart = startOfWeek(new Date(options.now), { weekStartsOn }).getTime();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const buckets = new Map<number, WeekBucket>();
  for (let i = options.weeks - 1; i >= 0; i--) {
    const weekStart = currentWeekStart - i * WEEK_MS;
    buckets.set(weekStart, { weekStart, volume: 0, sets: 0, sessionIds: new Set() });
  }

  const earliest = currentWeekStart - (options.weeks - 1) * WEEK_MS;

  for (const set of sets) {
    const weekStart = startOfWeek(new Date(set.startedAt), { weekStartsOn }).getTime();
    if (weekStart < earliest) continue;

    const bucket = buckets.get(weekStart);
    if (!bucket) continue;

    bucket.volume += volumeOf(set);
    bucket.sessionIds.add(set.sessionId);
    if (set.parentSetId === null && countsAsWorkingSet(set.setType)) bucket.sets += 1;
  }

  return [...buckets.values()].sort((a, b) => a.weekStart - b.weekStart);
}

export type ExerciseSessionSummary = {
  sessionId: string;
  startedAt: number;
  /** Massimale stimato più alto della seduta; `null` se non stimabile. */
  bestE1rm: number | null;
  /** Carico più alto sollevato nella seduta. */
  topWeight: number | null;
  volume: number;
  sets: number;
};

/**
 * Una riga per sessione: è la forma che serve ai grafici di progressione.
 * Le sedute in cui l'esercizio compare solo come riscaldamento non producono
 * un punto — non direbbero niente sulla progressione.
 */
export function progressionBySession(sets: StatSet[]): ExerciseSessionSummary[] {
  const bySession = new Map<string, ExerciseSessionSummary>();

  for (const set of sets) {
    if (!countsTowardVolume(set.setType)) continue;

    let summary = bySession.get(set.sessionId);
    if (!summary) {
      summary = {
        sessionId: set.sessionId,
        startedAt: set.startedAt,
        bestE1rm: null,
        topWeight: null,
        volume: 0,
        sets: 0,
      };
      bySession.set(set.sessionId, summary);
    }

    summary.volume += volumeOf(set);
    if (set.parentSetId === null && countsAsWorkingSet(set.setType)) summary.sets += 1;

    if (set.weight !== null && set.weight > 0) {
      summary.topWeight = Math.max(summary.topWeight ?? 0, set.weight);
    }

    const e1rm = estimate1RM(set.weight, set.reps);
    if (e1rm !== null) {
      summary.bestE1rm = Math.max(summary.bestE1rm ?? 0, e1rm);
    }
  }

  return [...bySession.values()]
    .filter((s) => s.sets > 0 || s.volume > 0)
    .sort((a, b) => a.startedAt - b.startedAt);
}

/**
 * Giorni consecutivi con almeno una settimana allenata, a ritroso dalla
 * settimana corrente. La settimana in corso non spezza la serie se è ancora
 * vuota: è normale che il lunedì mattina non ci sia ancora niente.
 */
export function weeklyStreak(buckets: WeekBucket[]): number {
  let streak = 0;
  for (let i = buckets.length - 1; i >= 0; i--) {
    const active = buckets[i].sessionIds.size > 0;
    if (!active) {
      if (i === buckets.length - 1) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

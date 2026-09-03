import { and, eq, gte } from 'drizzle-orm';

import { db } from '@/db/client';
import { exercises, sessionExercises, sessionSets, workoutSessions } from '@/db/schema';
import type { StatSet } from './aggregate';

/**
 * Le serie completate, appiattite con il muscolo e la data della sessione.
 *
 * È un `select` di Drizzle e non una funzione che restituisce dati, così può
 * essere passato a `useLiveQuery`: le statistiche si aggiornano da sole quando
 * si chiude un allenamento.
 */
export function statSetsQuery(since?: Date) {
  const conditions = [
    eq(workoutSessions.status, 'completed'),
    eq(sessionSets.isCompleted, true),
  ];
  if (since) conditions.push(gte(workoutSessions.startedAt, since));

  return db
    .select({
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      exerciseId: exercises.id,
      primaryMuscle: exercises.primaryMuscle,
      secondaryMuscles: exercises.secondaryMuscles,
      setType: sessionSets.setType,
      parentSetId: sessionSets.parentSetId,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
    .where(and(...conditions));
}

/** Come `statSetsQuery` ma per un solo esercizio, per i grafici di progressione. */
export function exerciseStatSetsQuery(exerciseId: string) {
  return db
    .select({
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      exerciseId: exercises.id,
      primaryMuscle: exercises.primaryMuscle,
      secondaryMuscles: exercises.secondaryMuscles,
      setType: sessionSets.setType,
      parentSetId: sessionSets.parentSetId,
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
    .where(
      and(
        eq(sessionExercises.exerciseId, exerciseId),
        eq(workoutSessions.status, 'completed'),
        eq(sessionSets.isCompleted, true),
      ),
    );
}

type RawStatRow = {
  sessionId: string;
  startedAt: Date;
  exerciseId: string;
  primaryMuscle: StatSet['primaryMuscle'];
  secondaryMuscles: StatSet['secondaryMuscles'];
  setType: StatSet['setType'];
  parentSetId: string | null;
  weight: number | null;
  reps: number | null;
};

/** Le date tornano come `Date`; le aggregazioni ragionano in epoch ms. */
export function toStatSets(rows: RawStatRow[] | undefined): StatSet[] {
  return (rows ?? []).map((row) => ({ ...row, startedAt: row.startedAt.getTime() }));
}

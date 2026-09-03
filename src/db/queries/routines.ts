import { asc, eq, isNull, max, sql } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { db } from '../client';
import {
  exercises,
  routineDays,
  routineExercises,
  routineSets,
  routines,
  type NewRoutineSet,
  type Routine,
  type RoutineDay,
  type RoutineExercise,
  type RoutineSet,
} from '../schema';

/* ────────────────────────────────────────────────────────────────── schede ── */

export function routineListQuery() {
  return db
    .select()
    .from(routines)
    .where(isNull(routines.archivedAt))
    .orderBy(asc(routines.orderIndex), asc(routines.createdAt));
}

export function routineQuery(id: string) {
  return db.select().from(routines).where(eq(routines.id, id));
}

export function createRoutine(name: string, notes?: string): string {
  const id = newId();
  const nextOrder = db.select({ value: max(routines.orderIndex) }).from(routines).get()?.value ?? -1;

  db.insert(routines)
    .values({ id, name, notes: notes ?? null, orderIndex: nextOrder + 1 })
    .run();
  return id;
}

export function updateRoutine(id: string, patch: Partial<Routine>): void {
  db.update(routines).set({ ...patch, updatedAt: new Date() }).where(eq(routines.id, id)).run();
}

/** Cancella davvero: le schede non compaiono nello storico, si possono perdere. */
export function deleteRoutine(id: string): void {
  db.delete(routines).where(eq(routines.id, id)).run();
}

/* ───────────────────────────────────────────────────────────────── giorni ── */

export function routineDaysQuery(routineId: string) {
  return db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId))
    .orderBy(asc(routineDays.orderIndex));
}

export function routineDayQuery(dayId: string) {
  return db.select().from(routineDays).where(eq(routineDays.id, dayId));
}

export function createDay(routineId: string, name: string): string {
  const id = newId();
  const nextOrder =
    db
      .select({ value: max(routineDays.orderIndex) })
      .from(routineDays)
      .where(eq(routineDays.routineId, routineId))
      .get()?.value ?? -1;

  db.insert(routineDays).values({ id, routineId, name, orderIndex: nextOrder + 1 }).run();
  return id;
}

export function updateDay(id: string, patch: Partial<RoutineDay>): void {
  db.update(routineDays).set(patch).where(eq(routineDays.id, id)).run();
}

export function deleteDay(id: string): void {
  db.delete(routineDays).where(eq(routineDays.id, id)).run();
}

/* ────────────────────────────────────────────── esercizi dentro un giorno ── */

/**
 * Gli esercizi di un giorno con i dati della libreria già uniti: la schermata
 * ha bisogno del nome e del tipo di misurazione, non solo dell'id.
 */
export function dayExercisesQuery(dayId: string) {
  return db
    .select({
      routineExercise: routineExercises,
      exercise: exercises,
    })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.dayId, dayId))
    .orderBy(asc(routineExercises.orderIndex));
}

export type DayExercise = {
  routineExercise: RoutineExercise;
  exercise: typeof exercises.$inferSelect;
};

/**
 * Aggiunge un esercizio al giorno con tre serie allenanti già pronte.
 *
 * Partire da zero serie costringerebbe a sette tap prima di avere qualcosa di
 * sensato; 3×8-10 è il punto di partenza che poi si aggiusta.
 */
export function addExerciseToDay(dayId: string, exerciseId: string): string {
  const exercise = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();

  const id = newId();
  const nextOrder =
    db
      .select({ value: max(routineExercises.orderIndex) })
      .from(routineExercises)
      .where(eq(routineExercises.dayId, dayId))
      .get()?.value ?? -1;

  db.transaction((tx) => {
    tx.insert(routineExercises)
      .values({
        id,
        dayId,
        exerciseId,
        orderIndex: nextOrder + 1,
        restSeconds: exercise?.defaultRestSeconds ?? null,
      })
      .run();

    tx.insert(routineSets)
      .values(
        Array.from({ length: 3 }, (_, i) => ({
          id: newId(),
          routineExerciseId: id,
          orderIndex: i,
          setType: 'working' as const,
          targetRepsMin: 8,
          targetRepsMax: 10,
        })),
      )
      .run();
  });

  return id;
}

export function updateRoutineExercise(id: string, patch: Partial<RoutineExercise>): void {
  db.update(routineExercises).set(patch).where(eq(routineExercises.id, id)).run();
}

export function removeRoutineExercise(id: string): void {
  db.delete(routineExercises).where(eq(routineExercises.id, id)).run();
}

/**
 * Sposta un esercizio di una posizione scambiandolo con il vicino.
 * Il riordino è a frecce e non a trascinamento: funziona anche con una mano
 * sola e non richiede una libreria di gesture.
 */
export function moveRoutineExercise(dayId: string, id: string, direction: -1 | 1): void {
  const list = db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.dayId, dayId))
    .orderBy(asc(routineExercises.orderIndex))
    .all();

  const index = list.findIndex((e) => e.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;

  db.transaction((tx) => {
    tx.update(routineExercises)
      .set({ orderIndex: list[target].orderIndex })
      .where(eq(routineExercises.id, list[index].id))
      .run();
    tx.update(routineExercises)
      .set({ orderIndex: list[index].orderIndex })
      .where(eq(routineExercises.id, list[target].id))
      .run();
  });
}

/**
 * Unisce un esercizio al precedente in un superset, o lo stacca se già unito.
 *
 * Il gruppo è identificato dall'`orderIndex` del primo esercizio della serie:
 * un numero qualsiasi purché condiviso, e questo è stabile e già disponibile.
 */
export function toggleSupersetWithPrevious(dayId: string, id: string): void {
  const list = db
    .select()
    .from(routineExercises)
    .where(eq(routineExercises.dayId, dayId))
    .orderBy(asc(routineExercises.orderIndex))
    .all();

  const index = list.findIndex((e) => e.id === id);
  if (index <= 0) return;

  const current = list[index];
  const previous = list[index - 1];

  if (current.supersetGroup !== null && current.supersetGroup === previous.supersetGroup) {
    // Stacca: se resta un solo esercizio nel gruppo, non è più un superset.
    const group = current.supersetGroup;
    db.transaction((tx) => {
      tx.update(routineExercises)
        .set({ supersetGroup: null })
        .where(eq(routineExercises.id, current.id))
        .run();

      const remaining = list.filter((e) => e.supersetGroup === group && e.id !== current.id);
      if (remaining.length === 1) {
        tx.update(routineExercises)
          .set({ supersetGroup: null })
          .where(eq(routineExercises.id, remaining[0].id))
          .run();
      }
    });
    return;
  }

  const group = previous.supersetGroup ?? previous.orderIndex;
  db.transaction((tx) => {
    tx.update(routineExercises)
      .set({ supersetGroup: group })
      .where(eq(routineExercises.id, previous.id))
      .run();
    tx.update(routineExercises)
      .set({ supersetGroup: group })
      .where(eq(routineExercises.id, current.id))
      .run();
  });
}

/* ────────────────────────────────────────────────────────── serie previste ── */

export function routineSetsQuery(routineExerciseId: string) {
  return db
    .select()
    .from(routineSets)
    .where(eq(routineSets.routineExerciseId, routineExerciseId))
    .orderBy(asc(routineSets.orderIndex));
}

/** Tutte le serie previste di un giorno, in una query sola. */
export function dayRoutineSetsQuery(dayId: string) {
  return db
    .select({ set: routineSets })
    .from(routineSets)
    .innerJoin(routineExercises, eq(routineSets.routineExerciseId, routineExercises.id))
    .where(eq(routineExercises.dayId, dayId))
    .orderBy(asc(routineExercises.orderIndex), asc(routineSets.orderIndex));
}

export function addRoutineSet(routineExerciseId: string, template?: Partial<NewRoutineSet>): string {
  const id = newId();
  const previous = db
    .select()
    .from(routineSets)
    .where(eq(routineSets.routineExerciseId, routineExerciseId))
    .orderBy(sql`${routineSets.orderIndex} desc`)
    .get();

  db.insert(routineSets)
    .values({
      id,
      routineExerciseId,
      orderIndex: (previous?.orderIndex ?? -1) + 1,
      // La serie nuova eredita dall'ultima: di solito si aggiunge "un'altra
      // uguale", non una serie da riconfigurare da capo.
      setType: template?.setType ?? previous?.setType ?? 'working',
      targetRepsMin: template?.targetRepsMin ?? previous?.targetRepsMin ?? 8,
      targetRepsMax: template?.targetRepsMax ?? previous?.targetRepsMax ?? 10,
      targetWeight: template?.targetWeight ?? previous?.targetWeight ?? null,
      targetRpe: template?.targetRpe ?? previous?.targetRpe ?? null,
      targetRir: template?.targetRir ?? previous?.targetRir ?? null,
      targetDurationSeconds:
        template?.targetDurationSeconds ?? previous?.targetDurationSeconds ?? null,
      technique: template?.technique ?? null,
    })
    .run();

  return id;
}

export function updateRoutineSet(id: string, patch: Partial<RoutineSet>): void {
  db.update(routineSets).set(patch).where(eq(routineSets.id, id)).run();
}

export function deleteRoutineSet(id: string): void {
  db.delete(routineSets).where(eq(routineSets.id, id)).run();
}

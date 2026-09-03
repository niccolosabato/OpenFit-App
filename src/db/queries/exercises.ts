import { and, asc, eq, inArray, isNull, like, or, sql, type SQL } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { db } from '../client';
import {
  MUSCLE_TO_GROUP,
  type Equipment,
  type MuscleGroup,
  type Muscle,
} from '../enums';
import { exercises, type Exercise, type NewExercise } from '../schema';

export type ExerciseFilters = {
  search?: string;
  /** `null` = tutti i gruppi. */
  group?: MuscleGroup | null;
  equipment?: Equipment | null;
  favoritesOnly?: boolean;
  /** Mostra anche gli esercizi archiviati (di norma nascosti). */
  includeArchived?: boolean;
};

/** Muscoli che ricadono in un gruppo, derivati dalla mappa in `enums.ts`. */
function musclesOfGroup(group: MuscleGroup): Muscle[] {
  return (Object.keys(MUSCLE_TO_GROUP) as Muscle[]).filter((m) => MUSCLE_TO_GROUP[m] === group);
}

/**
 * Query della libreria, pronta per `useLiveQuery`.
 *
 * La ricerca guarda nome **e** alias: in palestra lo stesso esercizio ha tre
 * nomi diversi, chi cerca "pulldown" deve trovare la lat machine.
 */
export function exerciseListQuery(filters: ExerciseFilters = {}) {
  const conditions: (SQL | undefined)[] = [];

  if (!filters.includeArchived) {
    conditions.push(isNull(exercises.archivedAt));
  }

  const term = filters.search?.trim().toLowerCase();
  if (term) {
    const pattern = `%${term}%`;
    conditions.push(
      or(
        like(sql`lower(${exercises.name})`, pattern),
        like(sql`lower(coalesce(${exercises.aliases}, ''))`, pattern),
      ),
    );
  }

  if (filters.group) {
    conditions.push(inArray(exercises.primaryMuscle, musclesOfGroup(filters.group)));
  }

  if (filters.equipment) {
    conditions.push(eq(exercises.equipment, filters.equipment));
  }

  if (filters.favoritesOnly) {
    conditions.push(eq(exercises.isFavorite, true));
  }

  return db
    .select()
    .from(exercises)
    .where(conditions.length ? and(...conditions) : undefined)
    // I preferiti in cima: sono gli esercizi che si cercano davvero ogni volta.
    .orderBy(sql`${exercises.isFavorite} desc`, asc(exercises.name));
}

export function getExercise(id: string): Exercise | undefined {
  return db.select().from(exercises).where(eq(exercises.id, id)).get();
}

/** Query di un singolo esercizio, per le schermate che devono restare reattive. */
export function exerciseQuery(id: string) {
  return db.select().from(exercises).where(eq(exercises.id, id));
}

export function toggleFavorite(id: string, isFavorite: boolean): void {
  db.update(exercises).set({ isFavorite }).where(eq(exercises.id, id)).run();
}

export function createCustomExercise(
  data: Omit<NewExercise, 'id' | 'isCustom' | 'createdAt'>,
): string {
  const id = newId();
  db.insert(exercises)
    .values({ ...data, id, isCustom: true })
    .run();
  return id;
}

export function updateExercise(id: string, patch: Partial<NewExercise>): void {
  db.update(exercises).set(patch).where(eq(exercises.id, id)).run();
}

/**
 * Un esercizio non si cancella: lo storico che lo cita deve restare leggibile.
 * Si archivia, sparisce dalla libreria e resta nelle sessioni passate.
 */
export function archiveExercise(id: string): void {
  db.update(exercises).set({ archivedAt: new Date() }).where(eq(exercises.id, id)).run();
}

export function restoreExercise(id: string): void {
  db.update(exercises).set({ archivedAt: null }).where(eq(exercises.id, id)).run();
}

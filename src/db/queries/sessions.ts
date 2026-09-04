import { and, asc, desc, eq, isNull, max, sql } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { db } from '../client';
import { countsTowardVolume, countsAsWorkingSet, type SetType, type Technique } from '../enums';
import {
  exercises,
  routineDays,
  routineExercises,
  routineSets,
  sessionExercises,
  sessionSets,
  workoutSessions,
  type Exercise,
  type NewSessionSet,
  type SessionExercise,
  type SessionSet,
  type WorkoutSession,
} from '../schema';

/* ─────────────────────────────────────────────────── sessione in corso ── */

/**
 * C'è al massimo una sessione attiva. È ciò che permette di riprendere
 * l'allenamento se l'app viene chiusa o va in crash a metà seduta.
 */
export function activeSessionQuery() {
  return db.select().from(workoutSessions).where(eq(workoutSessions.status, 'active'));
}

export function getActiveSession(): WorkoutSession | undefined {
  return db.select().from(workoutSessions).where(eq(workoutSessions.status, 'active')).get();
}

export function sessionQuery(sessionId: string) {
  return db.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId));
}

/* ───────────────────────────────────────────────────────────── avvio ── */

/**
 * Avvia una sessione copiando il programma del giorno.
 *
 * La copia è deliberata: da qui in poi la sessione è indipendente dalla
 * scheda. Cambiare la scheda domani non deve riscrivere l'allenamento di oggi,
 * e togliere una serie oggi non deve modificare il programma.
 */
export function startSessionFromDay(dayId: string): string {
  const day = db.select().from(routineDays).where(eq(routineDays.id, dayId)).get();
  if (!day) throw new Error('Giorno non trovato');

  const planned = db
    .select({ routineExercise: routineExercises, exercise: exercises })
    .from(routineExercises)
    .innerJoin(exercises, eq(routineExercises.exerciseId, exercises.id))
    .where(eq(routineExercises.dayId, dayId))
    .orderBy(asc(routineExercises.orderIndex))
    .all();

  const sessionId = newId();

  db.transaction((tx) => {
    tx.insert(workoutSessions)
      .values({
        id: sessionId,
        routineId: day.routineId,
        routineDayId: dayId,
        name: day.name,
        startedAt: new Date(),
        status: 'active',
      })
      .run();

    planned.forEach((item, index) => {
      const sessionExerciseId = newId();
      tx.insert(sessionExercises)
        .values({
          id: sessionExerciseId,
          sessionId,
          exerciseId: item.exercise.id,
          orderIndex: index,
          supersetGroup: item.routineExercise.supersetGroup,
          restSeconds: item.routineExercise.restSeconds,
          notes: item.routineExercise.notes,
        })
        .run();

      const plannedSets = tx
        .select()
        .from(routineSets)
        .where(eq(routineSets.routineExerciseId, item.routineExercise.id))
        .orderBy(asc(routineSets.orderIndex))
        .all();

      if (plannedSets.length === 0) return;

      tx.insert(sessionSets)
        .values(
          plannedSets.map((set, setIndex) => ({
            id: newId(),
            sessionExerciseId,
            orderIndex: setIndex,
            setType: set.setType,
            technique: set.technique,
            // Il carico previsto entra come suggerimento; le ripetizioni no,
            // perché il target è un intervallo e il dato vero lo mette l'utente.
            weight: set.targetWeight,
            isCompleted: false,
          })),
        )
        .run();
    });
  });

  return sessionId;
}

/** Allenamento libero: si parte vuoti e si aggiungono esercizi strada facendo. */
export function startEmptySession(name = 'Allenamento libero'): string {
  const id = newId();
  db.insert(workoutSessions).values({ id, name, startedAt: new Date(), status: 'active' }).run();
  return id;
}

/* ──────────────────────────────────────────── esercizi della sessione ── */

export function sessionExercisesQuery(sessionId: string) {
  return db
    .select({ sessionExercise: sessionExercises, exercise: exercises })
    .from(sessionExercises)
    .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex));
}

export type SessionExerciseRow = { sessionExercise: SessionExercise; exercise: Exercise };

export function addExerciseToSession(sessionId: string, exerciseId: string): string {
  const exercise = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();
  const id = newId();
  const nextOrder =
    db
      .select({ value: max(sessionExercises.orderIndex) })
      .from(sessionExercises)
      .where(eq(sessionExercises.sessionId, sessionId))
      .get()?.value ?? -1;

  db.transaction((tx) => {
    tx.insert(sessionExercises)
      .values({
        id,
        sessionId,
        exerciseId,
        orderIndex: nextOrder + 1,
        restSeconds: exercise?.defaultRestSeconds ?? null,
      })
      .run();

    // Una serie vuota pronta da riempire: aggiungere un esercizio senza serie
    // lascerebbe una card che non fa niente.
    tx.insert(sessionSets)
      .values({ id: newId(), sessionExerciseId: id, orderIndex: 0, setType: 'working' })
      .run();
  });

  return id;
}

export function removeSessionExercise(id: string): void {
  db.delete(sessionExercises).where(eq(sessionExercises.id, id)).run();
}

export function updateSessionExercise(id: string, patch: Partial<SessionExercise>): void {
  db.update(sessionExercises).set(patch).where(eq(sessionExercises.id, id)).run();
}

export function moveSessionExercise(sessionId: string, id: string, direction: -1 | 1): void {
  const list = db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex))
    .all();

  const index = list.findIndex((e) => e.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;

  db.transaction((tx) => {
    tx.update(sessionExercises)
      .set({ orderIndex: list[target].orderIndex })
      .where(eq(sessionExercises.id, list[index].id))
      .run();
    tx.update(sessionExercises)
      .set({ orderIndex: list[index].orderIndex })
      .where(eq(sessionExercises.id, list[target].id))
      .run();
  });
}

/* ─────────────────────────────────────────────── serie della sessione ── */

/** Tutte le serie di una sessione, figli inclusi, nell'ordine di esecuzione. */
export function sessionSetsQuery(sessionId: string) {
  return db
    .select({ set: sessionSets })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex), asc(sessionSets.orderIndex));
}

export function addSessionSet(sessionExerciseId: string, setType: SetType = 'working'): string {
  const id = newId();
  const previous = db
    .select()
    .from(sessionSets)
    .where(and(eq(sessionSets.sessionExerciseId, sessionExerciseId), isNull(sessionSets.parentSetId)))
    .orderBy(desc(sessionSets.orderIndex))
    .get();

  db.insert(sessionSets)
    .values({
      id,
      sessionExerciseId,
      orderIndex: (previous?.orderIndex ?? -1) + 1,
      setType,
      // Il carico si ripete quasi sempre fra una serie e la successiva:
      // precompilarlo evita di ridigitarlo cinque volte.
      weight: previous?.weight ?? null,
      reps: null,
    })
    .run();

  return id;
}

/**
 * Aggiunge un segmento a una serie estesa (drop, rest-pause, myo-rep, cluster).
 *
 * Il segmento eredita il carico del padre — in uno stripping lo si abbasserà,
 * in un rest-pause resta identico — e si posiziona in coda ai fratelli.
 */
export function addChildSet(parent: SessionSet, technique: Technique, childType: SetType): string {
  const id = newId();
  const siblings = db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.parentSetId, parent.id))
    .orderBy(desc(sessionSets.orderIndex))
    .all();

  const last = siblings[0];

  db.transaction((tx) => {
    // La tecnica vive sul padre: è lì che la UI decide cosa mostrare.
    if (parent.technique !== technique) {
      tx.update(sessionSets).set({ technique }).where(eq(sessionSets.id, parent.id)).run();
    }

    tx.insert(sessionSets)
      .values({
        id,
        sessionExerciseId: parent.sessionExerciseId,
        parentSetId: parent.id,
        orderIndex: (last?.orderIndex ?? -1) + 1,
        setType: childType,
        weight: last?.weight ?? parent.weight ?? null,
      })
      .run();
  });

  return id;
}

export function updateSessionSet(id: string, patch: Partial<NewSessionSet>): void {
  db.update(sessionSets).set(patch).where(eq(sessionSets.id, id)).run();
}

export function deleteSessionSet(id: string): void {
  // I figli cadono in cascata grazie alla foreign key su parent_set_id.
  db.delete(sessionSets).where(eq(sessionSets.id, id)).run();
}

/* ────────────────────────────────────────────────── volta precedente ── */

export type PreviousPerformance = {
  sessionId: string;
  performedAt: Date;
  sets: SessionSet[];
};

/**
 * Come è andato l'esercizio l'ultima volta.
 *
 * È la colonna "Precedente" della sessione: la singola informazione che
 * trasforma un diario in uno strumento di progressione, perché dice cosa
 * bisogna battere senza doverlo andare a cercare.
 */
export function getPreviousPerformance(
  exerciseId: string,
  excludeSessionId?: string,
): PreviousPerformance | null {
  const conditions = [
    eq(sessionExercises.exerciseId, exerciseId),
    eq(workoutSessions.status, 'completed'),
  ];
  if (excludeSessionId) {
    conditions.push(sql`${workoutSessions.id} <> ${excludeSessionId}`);
  }

  const last = db
    .select({
      sessionExerciseId: sessionExercises.id,
      sessionId: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
    })
    .from(sessionExercises)
    .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
    .where(and(...conditions))
    .orderBy(desc(workoutSessions.startedAt))
    .get();

  if (!last) return null;

  const sets = db
    .select()
    .from(sessionSets)
    .where(
      and(
        eq(sessionSets.sessionExerciseId, last.sessionExerciseId),
        eq(sessionSets.isCompleted, true),
        isNull(sessionSets.parentSetId),
      ),
    )
    .orderBy(asc(sessionSets.orderIndex))
    .all()
    // Solo le serie allenanti: in sessione la colonna "precedente" si allinea
    // per posizione, e un riscaldamento della volta scorsa finirebbe accanto
    // alla prima serie vera di oggi.
    .filter((set) => countsAsWorkingSet(set.setType));

  if (sets.length === 0) return null;

  return { sessionId: last.sessionId, performedAt: last.startedAt, sets };
}

/* ─────────────────────────────────────────────────────── chiusura ── */

/** Volume di una serie: carico esterno × ripetizioni, 0 se manca un dato. */
export function setVolume(set: SessionSet): number {
  if (!countsTowardVolume(set.setType)) return 0;
  if (!set.isCompleted) return 0;
  const weight = set.weight ?? 0;
  const reps = set.reps ?? 0;
  // Il corpo libero assistito ha carico negativo: non genera volume esterno.
  if (weight <= 0 || reps <= 0) return 0;
  return weight * reps;
}

export type SessionTotals = { totalVolume: number; totalSets: number; totalReps: number };

export function computeTotals(sets: SessionSet[]): SessionTotals {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const set of sets) {
    if (!set.isCompleted) continue;
    if (!countsTowardVolume(set.setType)) continue;
    totalVolume += setVolume(set);
    totalReps += set.reps ?? 0;
    // Le serie allenanti si contano solo di primo livello: uno stripping resta
    // una serie sola, per quanti scalini abbia.
    if (set.parentSetId === null && countsAsWorkingSet(set.setType)) totalSets += 1;
  }

  return { totalVolume, totalSets, totalReps };
}

/**
 * Chiude la sessione.
 *
 * Le serie non spuntate vengono scartate: erano righe preparate, non lavoro
 * svolto, e lasciarle falserebbe volume e statistiche. Gli esercizi che
 * restano senza nemmeno una serie completata spariscono con loro.
 */
export function finishSession(sessionId: string, notes?: string, perceivedEffort?: number): void {
  db.transaction((tx) => {
    const session = tx.select().from(workoutSessions).where(eq(workoutSessions.id, sessionId)).get();
    if (!session) return;

    tx.delete(sessionSets)
      .where(
        sql`${sessionSets.isCompleted} = 0 and ${sessionSets.sessionExerciseId} in (
          select ${sessionExercises.id} from ${sessionExercises}
          where ${sessionExercises.sessionId} = ${sessionId}
        )`,
      )
      .run();

    tx.delete(sessionExercises)
      .where(
        sql`${sessionExercises.sessionId} = ${sessionId} and ${sessionExercises.id} not in (
          select distinct ${sessionSets.sessionExerciseId} from ${sessionSets}
        )`,
      )
      .run();

    const remaining = tx
      .select({ set: sessionSets })
      .from(sessionSets)
      .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
      .where(eq(sessionExercises.sessionId, sessionId))
      .all()
      .map((row) => row.set);

    const totals = computeTotals(remaining);
    const endedAt = new Date();

    tx.update(workoutSessions)
      .set({
        status: 'completed',
        endedAt,
        durationSeconds: Math.max(
          0,
          Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
        ),
        notes: notes ?? session.notes,
        perceivedEffort: perceivedEffort ?? session.perceivedEffort,
        ...totals,
      })
      .where(eq(workoutSessions.id, sessionId))
      .run();
  });
}

/** Butta via la sessione: nulla di essa finisce nello storico. */
export function discardSession(sessionId: string): void {
  db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId)).run();
}

/* ───────────────────────────────────────────────────────── storico ── */

export function sessionHistoryQuery(limit = 100) {
  return db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.status, 'completed'))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);
}

export function deleteSession(sessionId: string): void {
  db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId)).run();
}

import { and, asc, desc, eq, isNull, max, sql } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { moveItem, supersetsToClear } from '@/lib/reorder';
import { setVolumeKg } from '@/lib/volume';
import { db } from '../client';
import {
  countsTowardVolume,
  countsAsWorkingSet,
  type SetType,
  type Technique,
  type TrackingType,
} from '../enums';
import { latestMeasurement } from './body';
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

/**
 * Peso corporeo della seduta, in kg.
 *
 * Si può correggere durante l'allenamento: la misurazione più recente è il
 * valore di partenza, non una condanna, e senza poterlo toccare una pesata
 * vecchia falserebbe il volume di tutta la seduta.
 */
export function updateSessionBodyweight(sessionId: string, bodyweight: number | null): void {
  db.update(workoutSessions).set({ bodyweight }).where(eq(workoutSessions.id, sessionId)).run();
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
  // Il peso corporeo si congela qui: da qui in poi il volume a corpo libero
  // della seduta non cambia più, anche se il profilo cambia domani.
  const bodyweight = latestMeasurement()?.weight ?? null;

  db.transaction((tx) => {
    tx.insert(workoutSessions)
      .values({
        id: sessionId,
        routineId: day.routineId,
        routineDayId: dayId,
        name: day.name,
        startedAt: new Date(),
        status: 'active',
        bodyweight,
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
  db.insert(workoutSessions)
    .values({
      id,
      name,
      startedAt: new Date(),
      status: 'active',
      bodyweight: latestMeasurement()?.weight ?? null,
    })
    .run();
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

/** Nota dell'intera seduta: "come è andata", gambe stanche, sensazioni. */
export function updateSessionNotes(sessionId: string, notes: string | null): void {
  db.update(workoutSessions).set({ notes }).where(eq(workoutSessions.id, sessionId)).run();
}

/**
 * Riscrive in blocco l'ordine degli esercizi di una sessione.
 *
 * Stesso mestiere di `reorderRoutineExercises`: insieme all'ordine vanno
 * rimessi a posto i superset, che sono contiguità e non sopravvivono a un
 * esercizio portato altrove. Da qui passa ogni riordino — il trascinamento e
 * le frecce del menu esercizio.
 */
export function reorderSessionExercises(sessionId: string, orderedIds: string[]): void {
  const list = sessionExercisesInOrder(sessionId);
  const byId = new Map(list.map((e) => [e.id, e]));
  const ordered = orderedIds.map((id) => byId.get(id)).filter((e) => e !== undefined);

  // Se la lista arrivata non copre esattamente la sessione è vecchia: meglio
  // non scrivere niente che lasciare fuori un esercizio.
  if (ordered.length !== list.length) return;

  writeSessionOrder(ordered);
}

function sessionExercisesInOrder(sessionId: string): SessionExercise[] {
  return db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, sessionId))
    .orderBy(asc(sessionExercises.orderIndex))
    .all();
}

/** Fissa una sequenza già verificata: indici 0..n-1 e superset ricuciti. */
function writeSessionOrder(ordered: SessionExercise[]): void {
  const toClear = new Set(supersetsToClear(ordered));

  db.transaction((tx) => {
    ordered.forEach((exercise, index) => {
      const supersetGroup = toClear.has(exercise.id) ? null : exercise.supersetGroup;
      if (exercise.orderIndex === index && exercise.supersetGroup === supersetGroup) return;

      tx.update(sessionExercises)
        .set({ orderIndex: index, supersetGroup })
        .where(eq(sessionExercises.id, exercise.id))
        .run();
    });
  });
}

/**
 * Sposta un esercizio di una posizione. Resta accanto al trascinamento come
 * ripiego preciso: un posto solo, senza mirare.
 */
export function moveSessionExercise(sessionId: string, id: string, direction: -1 | 1): void {
  const list = sessionExercisesInOrder(sessionId);

  const index = list.findIndex((e) => e.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= list.length) return;

  writeSessionOrder(moveItem(list, index, target));
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

/**
 * Volume di una serie in kg: carico esterno × ripetizioni, con il corpo a fare
 * da carico quando l'esercizio è a corpo libero. Vedi `lib/volume.ts`.
 */
export function setVolume(
  set: SessionSet,
  trackingType: TrackingType,
  bodyweight: number | null,
): number {
  if (!set.isCompleted) return 0;
  return setVolumeKg({
    setType: set.setType,
    trackingType,
    weight: set.weight,
    reps: set.reps,
    bodyweight,
  });
}

export type SessionTotals = { totalVolume: number; totalSets: number; totalReps: number };

/** `trackingTypeOf` risolve la serie al suo esercizio: il volume dipende da come si misura. */
export function computeTotals(
  sets: SessionSet[],
  trackingTypeOf: (sessionExerciseId: string) => TrackingType,
  bodyweight: number | null,
): SessionTotals {
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;

  for (const set of sets) {
    if (!set.isCompleted) continue;
    if (!countsTowardVolume(set.setType)) continue;
    totalVolume += setVolume(set, trackingTypeOf(set.sessionExerciseId), bodyweight);
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
      .select({ set: sessionSets, trackingType: exercises.trackingType })
      .from(sessionSets)
      .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
      .innerJoin(exercises, eq(sessionExercises.exerciseId, exercises.id))
      .where(eq(sessionExercises.sessionId, sessionId))
      .all();

    const trackingTypeByExercise = new Map(
      remaining.map((row) => [row.set.sessionExerciseId, row.trackingType]),
    );
    const totals = computeTotals(
      remaining.map((row) => row.set),
      (sessionExerciseId) => trackingTypeByExercise.get(sessionExerciseId) ?? 'weight_reps',
      session.bodyweight,
    );

    // Una sessione già chiusa e riaperta per la modifica conserva il suo
    // orario di fine e la sua durata: correggere una serie vecchia non deve
    // allungare l'allenamento fino ad adesso.
    const endedAt = session.endedAt ?? new Date();
    const durationSeconds =
      session.durationSeconds ??
      Math.max(0, Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000));

    tx.update(workoutSessions)
      .set({
        status: 'completed',
        endedAt,
        durationSeconds,
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

/**
 * Sposta un allenamento nel tempo. Inizio, fine e durata vanno insieme: la fine
 * è l'inizio più la durata, e tenerne una sola delle due disallineerebbe ciò
 * che lo storico mostra.
 */
export function updateSessionSchedule(
  id: string,
  startedAt: Date,
  endedAt: Date | null,
  durationSeconds: number | null,
): void {
  db.update(workoutSessions)
    .set({ startedAt, endedAt, durationSeconds })
    .where(eq(workoutSessions.id, id))
    .run();
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

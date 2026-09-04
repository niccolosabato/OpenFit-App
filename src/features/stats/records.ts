/**
 * Record personali.
 *
 * La tabella `personal_records` è una cache: la verità sta nelle serie
 * registrate. Tenerla materializzata serve a una cosa sola, ma importante —
 * poter dire "è un record" nell'istante in cui si spunta la serie, senza
 * scandire tutto lo storico mentre si è sotto il bilanciere.
 */

import { and, asc, eq, inArray } from 'drizzle-orm';

import { db } from '@/db/client';
import type { PrType } from '@/db/enums';
import {
  personalRecords,
  sessionExercises,
  sessionSets,
  workoutSessions,
  type SessionSet,
} from '@/db/schema';
import { newId } from '@/lib/ids';
import { beatsRecord, candidateRecords, type RecordCandidate } from './record-rules';

export { candidateRecords, type RecordCandidate } from './record-rules';

export type RecordHit = RecordCandidate & {
  /** Il valore che è stato battuto; `null` se è il primo record del tipo. */
  previous: number | null;
};

/**
 * Confronta i candidati con i record esistenti, salva quelli battuti e li
 * restituisce. Un pareggio non è un record: serve superare, non eguagliare.
 */
export function applyRecords(
  exerciseId: string,
  set: SessionSet,
  sessionId: string,
): RecordHit[] {
  const candidates = candidateRecords(set.weight, set.reps, set.setType);
  if (candidates.length === 0) return [];

  const existing = db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.exerciseId, exerciseId),
        inArray(
          personalRecords.type,
          candidates.map((c) => c.type),
        ),
      ),
    )
    .all();

  const key = (type: PrType, reps: number) => `${type}:${reps}`;
  const current = new Map(existing.map((r) => [key(r.type, r.reps), r]));

  const hits: RecordHit[] = [];
  const achievedAt = set.completedAt ?? new Date();

  for (const candidate of candidates) {
    const previous = current.get(key(candidate.type, candidate.reps));
    if (!beatsRecord(candidate.value, previous?.value)) continue;

    hits.push({ ...candidate, previous: previous?.value ?? null });

    const row = {
      exerciseId,
      type: candidate.type,
      reps: candidate.reps,
      value: candidate.value,
      weight: set.weight,
      achievedReps: set.reps,
      sessionSetId: set.id,
      sessionId,
      achievedAt,
      previousValue: previous?.value ?? null,
    };

    if (previous) {
      db.update(personalRecords).set(row).where(eq(personalRecords.id, previous.id)).run();
    } else {
      db.insert(personalRecords).values({ id: newId(), ...row }).run();
    }
  }

  return hits;
}

/**
 * Ricalcola da zero tutti i record a partire dalle serie registrate.
 *
 * Serve dopo aver cancellato o scartato una sessione: la riga del record
 * sopravviverebbe a una serie che non esiste più. Cancellarla e basta sarebbe
 * sbagliato quanto tenerla — il primato non svanisce, *retrocede* al secondo
 * miglior risultato — e solo un ricalcolo lo trova.
 *
 * Costa una scansione dello storico, ma gira solo quando si elimina qualcosa.
 */
export function rebuildRecords(): void {
  const rows = db
    .select({
      set: sessionSets,
      exerciseId: sessionExercises.exerciseId,
      sessionId: workoutSessions.id,
    })
    .from(sessionSets)
    .innerJoin(sessionExercises, eq(sessionSets.sessionExerciseId, sessionExercises.id))
    .innerJoin(workoutSessions, eq(sessionExercises.sessionId, workoutSessions.id))
    .where(and(eq(workoutSessions.status, 'completed'), eq(sessionSets.isCompleted, true)))
    // In ordine cronologico: a parità di valore il record resta al primo che
    // l'ha ottenuto, non all'ultimo.
    .orderBy(asc(workoutSessions.startedAt), asc(sessionSets.orderIndex))
    .all();

  type Best = {
    exerciseId: string;
    type: PrType;
    reps: number;
    value: number;
    weight: number | null;
    achievedReps: number | null;
    sessionSetId: string;
    sessionId: string;
    achievedAt: Date;
    previousValue: number | null;
  };

  const best = new Map<string, Best>();

  for (const row of rows) {
    for (const candidate of candidateRecords(row.set.weight, row.set.reps, row.set.setType)) {
      const key = `${row.exerciseId}:${candidate.type}:${candidate.reps}`;
      const previous = best.get(key);
      if (!beatsRecord(candidate.value, previous?.value)) continue;

      best.set(key, {
        exerciseId: row.exerciseId,
        type: candidate.type,
        reps: candidate.reps,
        value: candidate.value,
        weight: row.set.weight,
        achievedReps: row.set.reps,
        sessionSetId: row.set.id,
        sessionId: row.sessionId,
        achievedAt: row.set.completedAt ?? new Date(),
        previousValue: previous?.value ?? null,
      });
    }
  }

  const holders = new Set([...best.values()].map((b) => b.sessionSetId));

  db.transaction((tx) => {
    tx.delete(personalRecords).run();

    if (best.size > 0) {
      tx.insert(personalRecords)
        .values([...best.values()].map((b) => ({ id: newId(), ...b })))
        .run();
    }

    // La spunta 🏆 sulle righe dello storico è una cache come il resto:
    // va riallineata, altrimenti resterebbe accesa su serie non più record.
    tx.update(sessionSets).set({ isPr: false }).run();
    if (holders.size > 0) {
      tx.update(sessionSets)
        .set({ isPr: true })
        .where(inArray(sessionSets.id, [...holders]))
        .run();
    }
  });
}

export function exerciseRecordsQuery(exerciseId: string) {
  return db.select().from(personalRecords).where(eq(personalRecords.exerciseId, exerciseId));
}

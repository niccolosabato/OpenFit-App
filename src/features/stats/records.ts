/**
 * Record personali.
 *
 * La tabella `personal_records` è una cache: la verità sta nelle serie
 * registrate. Tenerla materializzata serve a una cosa sola, ma importante —
 * poter dire "è un record" nell'istante in cui si spunta la serie, senza
 * scandire tutto lo storico mentre si è sotto il bilanciere.
 */

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { db } from '@/db/client';
import type { PrType } from '@/db/enums';
import { personalRecords, type SessionSet } from '@/db/schema';
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
 * Toglie i record che puntano a serie non più esistenti.
 *
 * Serve dopo una modifica retroattiva o la cancellazione di una sessione: la
 * riga del record sopravviverebbe con `sessionSetId` a null e continuerebbe a
 * dichiarare un primato che nessuna serie sostiene più.
 */
export function pruneOrphanRecords(): number {
  const orphans = db
    .select({ id: personalRecords.id })
    .from(personalRecords)
    .where(isNull(personalRecords.sessionSetId))
    .all();

  if (orphans.length === 0) return 0;

  db.delete(personalRecords)
    .where(
      inArray(
        personalRecords.id,
        orphans.map((o) => o.id),
      ),
    )
    .run();

  return orphans.length;
}

export function exerciseRecordsQuery(exerciseId: string) {
  return db.select().from(personalRecords).where(eq(personalRecords.exerciseId, exerciseId));
}

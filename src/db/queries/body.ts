import { asc, desc, eq } from 'drizzle-orm';

import { newId } from '@/lib/ids';
import { db } from '../client';
import { bodyMeasurements, type BodyMeasurement, type NewBodyMeasurement } from '../schema';

export function bodyMeasurementsQuery(limit = 200) {
  return db
    .select()
    .from(bodyMeasurements)
    .orderBy(desc(bodyMeasurements.measuredOn))
    .limit(limit);
}

/** In ordine cronologico: è la forma che serve al grafico. */
export function bodyTrendQuery() {
  return db.select().from(bodyMeasurements).orderBy(asc(bodyMeasurements.measuredOn));
}

export function latestMeasurement(): BodyMeasurement | undefined {
  return db.select().from(bodyMeasurements).orderBy(desc(bodyMeasurements.measuredOn)).get();
}

/**
 * Una misurazione al giorno: registrarne una seconda per la stessa data
 * sovrascrive la prima invece di creare due punti nello stesso istante.
 */
export function saveMeasurement(measuredOn: string, values: Partial<NewBodyMeasurement>): void {
  const existing = db
    .select()
    .from(bodyMeasurements)
    .where(eq(bodyMeasurements.measuredOn, measuredOn))
    .get();

  if (existing) {
    db.update(bodyMeasurements).set(values).where(eq(bodyMeasurements.id, existing.id)).run();
    return;
  }

  db.insert(bodyMeasurements).values({ ...values, id: newId(), measuredOn }).run();
}

export function deleteMeasurement(id: string): void {
  db.delete(bodyMeasurements).where(eq(bodyMeasurements.id, id)).run();
}

import { eq } from 'drizzle-orm';

import { db } from '../client';
import { SETTINGS_ID } from '../bootstrap';
import { settings, type Settings } from '../schema';

/** Query da passare a `useLiveQuery` per seguire le impostazioni in tempo reale. */
export const settingsQuery = db.select().from(settings).where(eq(settings.id, SETTINGS_ID));

export function getSettings(): Settings | undefined {
  return db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).get();
}

export function updateSettings(patch: Partial<Omit<Settings, 'id'>>): void {
  db.update(settings).set(patch).where(eq(settings.id, SETTINGS_ID)).run();
}

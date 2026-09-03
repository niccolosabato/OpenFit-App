/**
 * Impostazioni e profilo, letti dal database in modo reattivo.
 *
 * Sono l'unica cosa che serve praticamente a ogni schermata (unità di misura,
 * accento, scala dello sforzo), quindi vivono in un context invece di essere
 * riqueryate ovunque. `useLiveQuery` fa sì che una modifica nel profilo si
 * propaghi subito a tutta l'app senza ricaricare nulla.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { SETTINGS_ID } from '@/db/bootstrap';
import { settingsQuery, updateSettings } from '@/db/queries/settings';
import type { Settings } from '@/db/schema';
import { DEFAULT_PLATE_INVENTORY } from '@/lib/plates';

/**
 * Usato nel frame fra il primo render e la prima lettura dal database.
 * Rispecchia i default dello schema: se cambiano lì, vanno cambiati qui.
 */
const FALLBACK: Settings = {
  id: SETTINGS_ID,
  userName: null,
  birthYear: null,
  heightCm: null,
  goal: null,
  experience: null,
  unit: 'kg',
  accent: 'volt',
  defaultRestSeconds: 90,
  autoStartTimer: true,
  timerSound: true,
  timerVibration: true,
  timerNotification: true,
  effortScale: 'rpe',
  keepAwake: true,
  prefillFromPrevious: true,
  barWeight: 20,
  plateInventory: DEFAULT_PLATE_INVENTORY,
  firstDayOfWeek: 1,
  weeklySessionGoal: 4,
  onboardingCompleted: false,
};

type SettingsContextValue = {
  settings: Settings;
  update: (patch: Partial<Omit<Settings, 'id'>>) => void;
  /** false finché la prima lettura dal database non è arrivata. */
  isLoaded: boolean;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useLiveQuery(settingsQuery);

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings: data?.[0] ?? FALLBACK,
      update: updateSettings,
      isLoaded: Boolean(data?.[0]),
    }),
    [data],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings va usato dentro <SettingsProvider>');
  return ctx;
}

/** Scorciatoia per il caso più frequente: formattare un carico. */
export function useUnit() {
  return useSettings().settings.unit;
}

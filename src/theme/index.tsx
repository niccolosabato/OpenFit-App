/**
 * Tema dell'app.
 *
 * I componenti non importano mai i colori direttamente da `tokens.ts`: passano
 * da `useTheme()`, così l'accento scelto nel profilo si applica ovunque senza
 * che nessuno se lo debba ricordare.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useSettings } from '@/store/settings';
import {
  ACCENTS,
  blurIntensity,
  DEFAULT_ACCENT,
  elevation,
  font,
  glass,
  HIT,
  MONO,
  neutral,
  radius,
  semantic,
  space,
  withAlpha,
  type Accent,
  type AccentKey,
} from './tokens';

export type ThemeColors = typeof neutral &
  typeof semantic & {
    accent: string;
    accentDim: string;
    onAccent: string;
    accentGlow: string;
    /** Velo d'accento per le superfici in vetro selezionate o attive. */
    accentTint: string;
    /** Velo d'accento più marcato: bordi di ciò che è attivo. */
    accentEdge: string;
    /** Velo rosso per le superfici distruttive in vetro. */
    dangerTint: string;
  };

export type Theme = {
  colors: ThemeColors;
  accentKey: AccentKey;
  space: typeof space;
  radius: typeof radius;
  font: typeof font;
  glass: typeof glass;
  elevation: typeof elevation;
  blurIntensity: typeof blurIntensity;
  mono: string;
  hit: number;
};

function buildTheme(accentKey: AccentKey): Theme {
  const accent: Accent = ACCENTS[accentKey] ?? ACCENTS[DEFAULT_ACCENT];
  return {
    colors: {
      ...neutral,
      ...semantic,
      accent: accent.base,
      accentDim: accent.dim,
      onAccent: accent.on,
      accentGlow: accent.glow,
      // Calcolati dall'accento invece che scritti a mano sei volte in
      // `ACCENTS`: aggiungere un accento non deve voler dire ricordarsi di
      // aggiungere anche le sue varianti traslucide.
      accentTint: withAlpha(accent.base, 0.12),
      accentEdge: withAlpha(accent.base, 0.42),
      dangerTint: withAlpha(semantic.danger, 0.14),
    },
    accentKey,
    space,
    radius,
    font,
    glass,
    elevation,
    blurIntensity,
    mono: MONO,
    hit: HIT,
  };
}

const ThemeContext = createContext<Theme>(buildTheme(DEFAULT_ACCENT));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const theme = useMemo(() => buildTheme(settings.accent), [settings.accent]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export * from './tokens';

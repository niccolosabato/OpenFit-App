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
  DEFAULT_ACCENT,
  elevation,
  family,
  FLOAT_INSET,
  font,
  HIT,
  MONO,
  motion,
  neutral,
  radius,
  semantic,
  space,
  type Accent,
  type AccentKey,
} from './tokens';

export type ThemeColors = typeof neutral &
  typeof semantic & {
    accent: string;
    accentDim: string;
    onAccent: string;
    /** Velo traslucido: fondi selezionati. */
    accentGlow: string;
    /** Velo più denso: bordi di ciò che è selezionato. */
    accentEdge: string;
    /** Alone ampio: la luce dietro un numero grande. */
    accentHalo: string;
  };

export type Theme = {
  colors: ThemeColors;
  accentKey: AccentKey;
  space: typeof space;
  radius: typeof radius;
  font: typeof font;
  /** Le famiglie tipografiche, per chi disegna testo fuori da `<Text>`. */
  family: typeof family;
  elevation: typeof elevation;
  motion: typeof motion;
  /** Distacco delle barre flottanti dai bordi dello schermo. */
  floatInset: number;
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
      accentEdge: accent.edge,
      accentHalo: accent.halo,
    },
    accentKey,
    space,
    radius,
    font,
    family,
    elevation,
    motion,
    floatInset: FLOAT_INSET,
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

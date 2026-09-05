/**
 * Superficie standard dell'app.
 *
 * Fondo carbone, bordo netto, nessuna ombra: la gerarchia si legge dalla
 * luminosità della superficie e dal bordo, come vuole `theme/tokens.ts`.
 *
 * Esiste per non ripetere in venti posti la stessa terna fondo/bordo/raggio, e
 * perché lo stato premuto e quello selezionato siano gli stessi ovunque.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type ElevationKey } from '@/theme';

export type SurfaceLevel =
  /** Card e liste, appoggiate sul fondo dell'app. */
  | 'low'
  /** Elementi sopra una card: input, righe di set, pillole. */
  | 'mid'
  /** Chrome fisso e pannelli dei fogli. */
  | 'high';

export type SurfaceProps = {
  children?: ReactNode;
  level?: SurfaceLevel;
  radius?: number;
  /** Segnala ciò che è selezionato, attivo o a fuoco. */
  tinted?: boolean;
  /** Azioni distruttive. */
  danger?: boolean;
  pressed?: boolean;
  /** Stacca la superficie dal fondo. Solo per ciò che galleggia sopra il contenuto. */
  elevation?: ElevationKey;
  style?: StyleProp<ViewStyle>;
};

export function Surface({
  children,
  level = 'low',
  radius,
  tinted = false,
  danger = false,
  pressed = false,
  elevation = 'none',
  style,
}: SurfaceProps) {
  const theme = useTheme();

  const background = {
    low: theme.colors.surface,
    mid: theme.colors.surface2,
    high: theme.colors.surface,
  }[level];

  const backgroundColor = pressed
    ? theme.colors.surface3
    : danger
      ? theme.colors.dangerDim
      : tinted
        ? theme.colors.accentGlow
        : background;

  return (
    <View
      style={[
        theme.elevation[elevation],
        {
          backgroundColor,
          borderRadius: radius ?? theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: danger
            ? theme.colors.danger
            : tinted
              ? theme.colors.accent
              : theme.colors.border,
          overflow: 'hidden',
        },
        style,
      ]}>
      {children}
    </View>
  );
}

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

/**
 * I tre livelli sono una scala: ogni gradino è più chiaro del precedente, e
 * serve a far vedere cosa sta sopra cosa. Vanno usati in ordine — un controllo
 * dentro un contenitore prende sempre il livello successivo, altrimenti i due
 * hanno lo stesso colore e il controllo sparisce.
 */
export type SurfaceLevel =
  /** Card, liste e barre: appoggiate sul fondo dell'app. */
  | 'low'
  /** Ciò che sta sopra a quelle: input, pillole, bersagli icona. */
  | 'mid'
  /** Pannelli dei fogli e avvisi: sopra tutto il resto. */
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
    high: theme.colors.surface3,
  }[level];

  /**
   * Il colore degli stati non va sul fondo della vista ma su un velo sopra.
   *
   * Cambiare il `backgroundColor` di una vista arrotondata fa ricostruire ad
   * Android il suo sfondo, che si ridisegna **senza raggio**: bastava premere
   * una card o selezionare una voce per vederla tornare quadrata. Il velo
   * invece è un figlio, e il raggio del contenitore non lo tocca nessuno;
   * ci pensa `overflow: 'hidden'` a ritagliarlo sulla forma giusta.
   */
  const veil = pressed
    ? theme.colors.surface3
    : tinted
      ? theme.colors.accentGlow
      : null;

  return (
    <View
      style={[
        theme.elevation[elevation],
        {
          backgroundColor: danger ? theme.colors.dangerDim : background,
          borderRadius: radius ?? theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth * 2,
          // Il bordo segue solo la variante, che per una data istanza non
          // cambia mai: se seguisse anche lo stato ricadremmo nello stesso
          // problema del fondo.
          borderColor: danger ? theme.colors.danger : theme.colors.border,
          overflow: 'hidden',
        },
        style,
      ]}>
      {veil ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: veil }]} pointerEvents="none" />
      ) : null}
      {/* L'anello di ciò che è selezionato. Anche questo è un figlio e non il
          bordo del contenitore, per la stessa ragione del velo. */}
      {tinted ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderWidth: StyleSheet.hairlineWidth * 2,
              borderColor: theme.colors.accent,
              borderRadius: radius ?? theme.radius.lg,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

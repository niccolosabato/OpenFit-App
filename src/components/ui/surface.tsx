/**
 * Superficie standard dell'app.
 *
 * La gerarchia è **tonale**: ogni livello è abbastanza più chiaro di quello
 * che lo contiene da leggersi da solo. Il bordo è una rifinitura dello
 * spigolo, non il modo in cui si capisce dove finisce una card — era il
 * contrario, e dieci card di fila diventavano una griglia di rettangoli.
 *
 * Esiste per non ripetere in venti posti la stessa terna fondo/bordo/raggio, e
 * perché lo stato premuto e quello selezionato siano gli stessi ovunque.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme, type ElevationKey } from '@/theme';

/**
 * I quattro livelli sono una scala e vanno usati in ordine: un controllo
 * dentro un contenitore prende sempre il livello successivo, altrimenti i due
 * hanno lo stesso colore e il controllo sparisce.
 */
export type SurfaceLevel =
  /** Card, liste e barre: appoggiate sul fondo dell'app. */
  | 'low'
  /** Ciò che sta sopra a quelle: input, pillole, bersagli icona. */
  | 'mid'
  /** Pannelli dei fogli, avvisi, stato premuto. */
  | 'high'
  /** Un controllo dentro un foglio: l'ultimo gradino. */
  | 'top';

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
  /**
   * Il filo sullo spigolo. Acceso di default; si spegne per le superfici che
   * stanno dentro un'altra e non devono disegnare una seconda cornice a un
   * millimetro dalla prima.
   */
  bordered?: boolean;
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
  bordered = true,
  style,
}: SurfaceProps) {
  const theme = useTheme();

  const background = {
    low: theme.colors.surface,
    mid: theme.colors.surface2,
    high: theme.colors.surface3,
    top: theme.colors.surface4,
  }[level];

  const corner = radius ?? theme.radius.lg;

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
    ? 'rgba(255, 255, 255, 0.07)'
    : tinted
      ? theme.colors.accentGlow
      : null;

  return (
    <View
      style={[
        theme.elevation[elevation],
        {
          backgroundColor: danger ? theme.colors.dangerDim : background,
          borderRadius: corner,
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          // Il bordo segue solo la variante, che per una data istanza non
          // cambia mai: se seguisse anche lo stato ricadremmo nello stesso
          // problema del fondo.
          borderColor: danger ? theme.colors.dangerEdge : theme.colors.border,
          overflow: 'hidden',
        },
        // Un filo più chiaro sul bordo superiore, solo per ciò che
        // galleggia: accenna uno spigolo illuminato che stacca la barra dal
        // fondo, senza aggiungere gradienti alla tavolozza.
        elevation !== 'none' && bordered && { borderTopColor: theme.colors.borderStrong },
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
              borderColor: theme.colors.accentEdge,
              borderRadius: corner,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

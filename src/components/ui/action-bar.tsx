/**
 * Barra di azioni ancorata in fondo allo schermo.
 *
 * Esiste per una ragione sola: l'azione principale di una schermata non deve
 * scorrere via. Prima di questa barra "Inizia questo allenamento" era l'ultimo
 * elemento del builder — dopo otto esercizi da quattro serie significava due
 * schermate di scroll per far partire l'allenamento che si ha davanti.
 *
 * Sta sopra il contenuto, non dentro: chi la usa deve lasciare in fondo al
 * proprio scroll uno spazio pari a `actionBarSpace(insets)`, altrimenti la
 * barra copre le ultime righe.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Glass } from './glass';

/** Altezza della barra senza l'area sicura: un bersaglio da 48 più i margini. */
export const ACTION_BAR_HEIGHT = 48 + 12 * 2;

/**
 * Quanto spazio lasciare in fondo a uno scroll sormontato dalla barra.
 * Va sommato al `paddingBottom` del contenuto, non alla schermata.
 */
export function actionBarSpace(insets: EdgeInsets): number {
  return ACTION_BAR_HEIGHT + insets.bottom;
}

export function ActionBar({
  children,
  /**
   * La barra galleggia sopra la tab bar quando la schermata ne ha una:
   * serve a non coprirla.
   */
  offsetBottom = 0,
  style,
}: {
  children: ReactNode;
  offsetBottom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.root, { bottom: offsetBottom }]}
      // Il contenitore è trasparente e lascia passare i tocchi ai lati della
      // barra; solo il vetro li intercetta.
      pointerEvents="box-none">
      <Glass
        level="high"
        elevation="high"
        blur
        radius={0}
        sheen={false}
        style={[
          {
            paddingTop: theme.space.md,
            paddingBottom: Math.max(insets.bottom, theme.space.md),
            paddingHorizontal: theme.space.lg,
            gap: theme.space.md,
            flexDirection: 'row',
            alignItems: 'center',
            // Il bordo laterale non serve: la barra tocca i due lati dello schermo.
            borderLeftWidth: 0,
            borderRightWidth: 0,
            borderBottomWidth: 0,
          },
          style,
        ]}>
        {children}
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', left: 0, right: 0 },
});

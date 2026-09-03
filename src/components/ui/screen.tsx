/**
 * Contenitore di schermata: fondo del tema e aree sicure.
 *
 * Il bordo inferiore è escluso di default perché sopra ci va la tab bar (o la
 * barra della sessione), che gestisce da sé la propria area sicura.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export function Screen({
  children,
  padded = true,
  edges = ['top'],
  style,
}: {
  children: ReactNode;
  /** Applica il margine orizzontale standard. */
  padded?: boolean;
  edges?: ('top' | 'bottom')[];
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.bg,
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
          paddingHorizontal: padded ? theme.space.lg : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

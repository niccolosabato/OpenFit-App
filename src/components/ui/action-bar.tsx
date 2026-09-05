/**
 * Barra di azioni ancorata in fondo allo schermo.
 *
 * Esiste per una ragione sola: l'azione principale di una schermata non deve
 * scorrere via. Prima di questa barra "Inizia questo allenamento" era l'ultimo
 * elemento del builder — dopo otto esercizi da quattro serie significava due
 * schermate di scroll per far partire l'allenamento che si ha davanti.
 *
 * Non si posiziona da sé: va passata a `Screen` come `actionBar`, che la
 * ancora in basso e ne misura l'altezza perché lo scroll possa lasciarle posto.
 */

import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { Surface } from './surface';

export function ActionBar({
  children,
  /**
   * L'area sicura in fondo. Si disattiva quando sotto c'è già qualcos'altro
   * che se ne occupa — la tab bar, per esempio.
   */
  safeBottom = true,
  style,
}: {
  children: ReactNode;
  safeBottom?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    // Fascia opaca che nasconde il contenuto che le scorre sotto, e dentro la
    // barra vera: arrotondata e staccata dai bordi dello schermo.
    <View
      style={{
        backgroundColor: theme.colors.bg,
        paddingHorizontal: theme.floatInset,
        paddingTop: theme.floatInset,
        // Senza questo i pulsanti finiscono sotto la barra dei gesti: è il
        // difetto che la barra del recupero aveva da sempre.
        paddingBottom: safeBottom ? Math.max(insets.bottom, theme.floatInset) : theme.floatInset,
      }}>
      <Surface
        level="mid"
        elevation="float"
        radius={theme.radius.xl}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
            padding: theme.space.sm,
          },
          style,
        ]}>
        {children}
      </Surface>
    </View>
  );
}

/** Contenitore dell'azione principale: si prende tutto lo spazio che resta. */
export function ActionBarPrimary({ children }: { children: ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

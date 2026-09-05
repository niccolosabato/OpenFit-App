import type { ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Surface } from './surface';

/**
 * Superficie standard: fondo carbone e bordo netto.
 * Se riceve `onPress` diventa toccabile e reagisce alla pressione.
 */
export function Card({
  children,
  onPress,
  onLongPress,
  style,
  padded = true,
  /** Vela la card con l'accento: usarla per ciò che è selezionato o in corso. */
  tinted = false,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
  tinted?: boolean;
}) {
  const theme = useTheme();

  const padding: ViewStyle = { padding: padded ? theme.space.lg : 0 };

  if (!onPress && !onLongPress) {
    return (
      <Surface level="low" tinted={tinted} style={[padding, style]}>
        {children}
      </Surface>
    );
  }

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      {({ pressed }) => (
        <Surface level="low" tinted={tinted} pressed={pressed} style={[padding, style]}>
          {children}
        </Surface>
      )}
    </Pressable>
  );
}

import type { ReactNode } from 'react';
import { Pressable, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Glass } from './glass';

/**
 * Superficie standard: una lastra di vetro sul fondo scuro.
 * Se riceve `onPress` diventa toccabile e il vetro si schiarisce alla pressione.
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
      <Glass level="low" elevation="low" tinted={tinted} style={[padding, style]}>
        {children}
      </Glass>
    );
  }

  return (
    <Pressable onPress={onPress} onLongPress={onLongPress}>
      {({ pressed }) => (
        <Glass level="low" elevation="low" tinted={tinted} pressed={pressed} style={[padding, style]}>
          {children}
        </Glass>
      )}
    </Pressable>
  );
}

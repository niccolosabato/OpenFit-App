import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

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
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const theme = useTheme();

  const base: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: theme.radius.lg,
    padding: padded ? theme.space.lg : 0,
  };

  if (!onPress && !onLongPress) {
    return <View style={[base, style]}>{children}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [base, pressed && { backgroundColor: theme.colors.surface2 }, style]}>
      {children}
    </Pressable>
  );
}

import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

export type ButtonVariant =
  /** Azione principale della schermata: pieno, colore accento. */
  | 'primary'
  /** Azione secondaria: superficie con bordo. */
  | 'secondary'
  /** Terziaria: solo testo. */
  | 'ghost'
  /** Distruttiva: elimina, termina, resetta. */
  | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  fullWidth,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const height = size === 'sm' ? 38 : size === 'lg' ? 56 : theme.hit;

  const surface: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: theme.colors.accent },
    secondary: {
      backgroundColor: theme.colors.surface2,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.borderStrong,
    },
    ghost: { backgroundColor: 'transparent' },
    danger: { backgroundColor: theme.colors.dangerDim, borderWidth: 1, borderColor: theme.colors.danger },
  };

  const labelTone = {
    primary: 'onAccent',
    secondary: 'default',
    ghost: 'accent',
    danger: 'danger',
  } as const;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          borderRadius: theme.radius.md,
          paddingHorizontal: size === 'sm' ? theme.space.md : theme.space.lg,
          gap: theme.space.sm,
        },
        surface[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.onAccent : theme.colors.accent} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text
            variant={size === 'sm' ? 'caption' : 'subtitle'}
            tone={labelTone[variant]}
            style={styles.label}
            numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
  label: { fontWeight: '700' },
});

import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Glass } from './glass';
import { Text } from './text';

export type ButtonVariant =
  /** Azione principale della schermata: pieno, colore accento. */
  | 'primary'
  /** Azione secondaria: vetro con bordo. */
  | 'secondary'
  /** Terziaria: solo testo. */
  | 'ghost'
  /** Distruttiva: elimina, termina, resetta. */
  | 'danger';

/**
 * Le altezze.
 *
 * `sm` era 38: sotto la soglia dei 48dp che il progetto si è dato per tutto
 * ciò che si tocca a mani sudate. Ora parte da 44 e serve solo dove il bottone
 * sta in una riga fitta; l'azione principale di una schermata usa `lg`.
 */
const HEIGHT = { sm: 44, md: 48, lg: 56 } as const;

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

  const height = HEIGHT[size];
  const radius = theme.radius.md;

  const labelTone = {
    primary: 'onAccent',
    secondary: 'default',
    ghost: 'accent',
    danger: 'danger',
  } as const;

  const content = (
    <>
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
    </>
  );

  const box: ViewStyle = {
    height,
    borderRadius: radius,
    paddingHorizontal: size === 'sm' ? theme.space.md : theme.space.lg,
    gap: theme.space.sm,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}>
      {({ pressed }) => {
        // Il primario resta una tinta piena: è l'unico elemento che deve
        // "bucare" il vetro e farsi trovare senza cercarlo.
        if (variant === 'primary') {
          return (
            <View
              style={[
                styles.base,
                box,
                theme.elevation.low,
                { backgroundColor: theme.colors.accent },
                pressed && styles.pressed,
              ]}>
              {content}
            </View>
          );
        }

        if (variant === 'ghost') {
          return (
            <View style={[styles.base, box, pressed && styles.pressed]}>{content}</View>
          );
        }

        return (
          <Glass
            level="mid"
            elevation="low"
            radius={radius}
            danger={variant === 'danger'}
            pressed={pressed}
            style={[styles.base, box]}>
            {content}
          </Glass>
        );
      }}
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

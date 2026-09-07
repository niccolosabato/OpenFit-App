import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { capsule, useTheme } from '@/theme';
import { Surface } from './surface';
import { Text } from './text';
import { usePressScale } from './use-press-scale';

export type ButtonVariant =
  /** Azione principale della schermata: pieno, colore accento. */
  | 'primary'
  /** Azione secondaria: superficie con bordo marcato. */
  | 'secondary'
  /** Terziaria: solo testo. */
  | 'ghost'
  /** Distruttiva: elimina, termina, resetta. */
  | 'danger';

/**
 * Le altezze.
 *
 * `sm` è 44 e non meno: è la soglia che il progetto si è dato per tutto ciò
 * che si tocca a mani sudate, e vale anche per il bottone stretto in fondo a
 * una riga. L'azione principale di una schermata usa `lg`.
 */
const HEIGHT = { sm: 44, md: 50, lg: 56 } as const;

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
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const press = usePressScale();

  const height = HEIGHT[size];
  const radius = capsule(height);

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
            variant="subtitle"
            tone={labelTone[variant]}
            style={[styles.label, size === 'lg' && { fontSize: theme.font.size.lg }]}
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
    paddingHorizontal: size === 'sm' ? theme.space.md : theme.space.xl,
    gap: theme.space.sm,
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      style={[fullWidth && styles.fullWidth, isDisabled && styles.disabled, style]}>
      {({ pressed }) => (
        <Animated.View style={press.style}>
          {/* Il primario resta una tinta piena: è l'unico elemento che deve
              farsi trovare senza cercarlo. */}
          {variant === 'primary' ? (
            <View
              style={[
                styles.base,
                box,
                { backgroundColor: theme.colors.accent },
                pressed && styles.pressed,
              ]}>
              {content}
            </View>
          ) : variant === 'ghost' ? (
            <View style={[styles.base, box, pressed && styles.pressed]}>{content}</View>
          ) : (
            <Surface
              level="mid"
              radius={radius}
              danger={variant === 'danger'}
              pressed={pressed}
              // Bordo marcato: un bottone deve leggersi come tale anche appoggiato
              // su una card, che ha un fondo di poco più scuro.
              style={[styles.base, box, variant !== 'danger' && { borderColor: theme.colors.borderStrong }]}>
              {content}
            </Surface>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  fullWidth: { alignSelf: 'stretch' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.35 },
  // Senza `flexShrink` un'etichetta più larga del bottone non si accorcia:
  // deborda da un lato e sembra spostata invece che troncata.
  label: { flexShrink: 1 },
});

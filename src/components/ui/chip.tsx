import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { capsule, useTheme } from '@/theme';
import { Surface } from './surface';
import { Text } from './text';
import { usePressScale } from './use-press-scale';

/**
 * Pillola selezionabile: filtri, tipi di set, gruppi muscolari.
 *
 * Selezionata si riempie d'accento, a riposo resta una superficie. Le altezze
 * minime (44, o 36 in versione compatta) tengono i filtri toccabili anche di
 * fretta: prima erano alti quanto il testo che contenevano.
 *
 * Per una scelta obbligata fra poche opzioni non si usa un chip ma
 * `Segmented`: un chip si spegne, e usarne uno dove non si può spegnere niente
 * promette qualcosa che non c'è.
 */
export function Chip({
  label,
  selected,
  onPress,
  compact,
  icon,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const press = usePressScale();

  const height = compact ? 36 : 44;
  const box = {
    height,
    paddingHorizontal: compact ? theme.space.md : theme.space.lg,
    gap: compact ? 6 : theme.space.sm,
  };

  const glyph = icon ? (
    <MaterialCommunityIcons
      name={icon}
      size={compact ? 14 : 16}
      color={selected ? theme.colors.onAccent : theme.colors.textDim}
    />
  ) : null;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={style}>
      {({ pressed }) => (
        <Animated.View style={press.style}>
          {selected ? (
            <View
              style={[
                styles.chip,
                box,
                {
                  borderRadius: capsule(height),
                  backgroundColor: theme.colors.accent,
                  borderColor: theme.colors.accent,
                },
                pressed && styles.pressed,
              ]}>
              {glyph}
              <Text variant="caption" weight="semibold" tone="onAccent" style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ) : (
            <Surface level="mid" radius={capsule(height)} pressed={pressed} style={[styles.chip, box]}>
              {glyph}
              <Text variant="caption" weight="semibold" tone="dim" style={styles.label} numberOfLines={1}>
                {label}
              </Text>
            </Surface>
          )}
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Riga di filtri scorrevole in orizzontale. */
export function ChipRow({
  children,
  /** Margine ai due capi. Piccolo dentro un header, che ha già il suo. */
  inset,
}: {
  children: React.ReactNode;
  inset?: number;
}) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: theme.space.sm,
        paddingHorizontal: inset ?? theme.space.sm,
        alignItems: 'center',
      }}>
      {children}
    </ScrollView>
  );
}

/** Etichetta non interattiva: sigle dei tipi di set, badge attrezzo. */
export function Tag({ label, color }: { label: string; color?: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tag,
        {
          borderRadius: theme.radius.sm,
          borderColor: color ? color : theme.colors.border,
          backgroundColor: theme.colors.surface2,
        },
      ]}>
      <Text variant="label" style={{ color: color ?? theme.colors.textDim }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.8 },
  label: { flexShrink: 1 },
  tag: { borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 8, paddingVertical: 4 },
});

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { capsule, useTheme } from '@/theme';
import { Surface } from './surface';
import { Text } from './text';

/**
 * Pillola selezionabile: filtri, tipi di set, gruppi muscolari.
 *
 * Selezionata si riempie d'accento, a riposo resta una superficie. Le altezze minime
 * (44, o 36 in versione compatta) tengono i filtri toccabili anche di fretta:
 * prima erano alti quanto il testo che contenevano.
 */
export function Chip({
  label,
  selected,
  onPress,
  compact,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
}) {
  const theme = useTheme();

  const height = compact ? 36 : 44;
  const box = {
    height,
    paddingHorizontal: compact ? theme.space.md : theme.space.lg,
  };

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }}>
      {({ pressed }) =>
        selected ? (
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
            <Text variant="caption" tone="onAccent" style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </View>
        ) : (
          <Surface
            level="mid"
            radius={capsule(height)}
            pressed={pressed}
            style={[styles.chip, box]}>
            <Text variant="caption" tone="dim" style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Surface>
        )
      }
    </Pressable>
  );
}

/** Riga di filtri scorrevole in orizzontale. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Il margine è piccolo perché la riga vive dentro l'header, che ha
      // già il proprio.
      contentContainerStyle={{ gap: theme.space.sm, paddingHorizontal: theme.space.sm }}>
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
          borderColor: color ?? theme.colors.border,
          backgroundColor: theme.colors.surface2,
        },
      ]}>
      <Text variant="label" style={[styles.tagLabel, { color: color ?? theme.colors.textDim }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: { opacity: 0.7 },
  label: { fontWeight: '600' },
  tag: { borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 6, paddingVertical: 2 },
  tagLabel: { fontSize: 9, letterSpacing: 0.6 },
});

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Glass } from './glass';
import { Text } from './text';

/**
 * Pillola selezionabile: filtri, tipi di set, gruppi muscolari.
 *
 * Selezionata si riempie d'accento; a riposo è vetro. Le altezze minime
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

  const box = {
    paddingVertical: compact ? 6 : 10,
    paddingHorizontal: compact ? theme.space.md : theme.space.lg,
    minHeight: compact ? 36 : 44,
  };

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }}>
      {({ pressed }) =>
        selected ? (
          <View
            style={[
              styles.chip,
              box,
              theme.elevation.low,
              {
                borderRadius: theme.radius.pill,
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
          <Glass
            level="mid"
            radius={theme.radius.pill}
            sheen={false}
            pressed={pressed}
            style={[styles.chip, box]}>
            <Text variant="caption" tone="dim" style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          </Glass>
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
      contentContainerStyle={{ gap: theme.space.sm, paddingHorizontal: theme.space.lg }}>
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
          borderColor: color ?? theme.glass.stroke,
          backgroundColor: theme.glass.fillMid,
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

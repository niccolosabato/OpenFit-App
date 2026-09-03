import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

/** Pillola selezionabile: filtri, tipi di set, gruppi muscolari. */
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

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: theme.radius.pill,
          paddingVertical: compact ? 5 : 8,
          paddingHorizontal: compact ? theme.space.md : theme.space.lg,
          backgroundColor: selected ? theme.colors.accent : theme.colors.surface2,
          borderColor: selected ? theme.colors.accent : theme.colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}>
      <Text variant="caption" tone={selected ? 'onAccent' : 'dim'} style={styles.label} numberOfLines={1}>
        {label}
      </Text>
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
  chip: { borderWidth: StyleSheet.hairlineWidth * 2, justifyContent: 'center' },
  label: { fontWeight: '600' },
  tag: { borderWidth: StyleSheet.hairlineWidth * 2, paddingHorizontal: 6, paddingVertical: 2 },
  tagLabel: { fontSize: 9, letterSpacing: 0.6 },
});

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Equipment } from '@/db/enums';
import type { Exercise } from '@/db/schema';
import { useTheme } from '@/theme';

/** Icona che riassume l'attrezzo, per riconoscere la riga senza leggerla. */
const EQUIPMENT_ICON: Record<Equipment, keyof typeof MaterialCommunityIcons.glyphMap> = {
  barbell: 'weight',
  dumbbell: 'dumbbell',
  machine: 'cog-outline',
  cable: 'cable-data',
  smith: 'view-grid-outline',
  bodyweight: 'human-handsup',
  kettlebell: 'kettlebell',
  band: 'infinity',
  ez_bar: 'weight',
  trap_bar: 'weight',
  plate: 'circle-slice-8',
  other: 'shape-outline',
};

export function ExerciseRow({
  exercise,
  onPress,
  onToggleFavorite,
  /** Riga di dettaglio a destra: ultimo carico, numero di serie, ecc. */
  trailing,
  /** In selezione multipla la riga mostra una spunta invece della stella. */
  selectable = false,
  selected = false,
}: {
  exercise: Exercise;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  trailing?: React.ReactNode;
  selectable?: boolean;
  selected?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: theme.hit + 8,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          gap: theme.space.md,
          borderBottomColor: theme.glass.stroke,
        },
        pressed && { backgroundColor: theme.glass.fillLow },
      ]}>
      <Glass level="mid" radius={theme.radius.md} sheen={false} tinted={selected} style={styles.icon}>
        <MaterialCommunityIcons
          name={selected ? 'check' : EQUIPMENT_ICON[exercise.equipment]}
          size={20}
          color={selected ? theme.colors.accent : theme.colors.textDim}
        />
      </Glass>

      <View style={styles.body}>
        <Text variant="subtitle" numberOfLines={1}>
          {exercise.name}
        </Text>
        <Text variant="caption" tone="faint" numberOfLines={1}>
          {MUSCLE_LABELS[exercise.primaryMuscle]} · {EQUIPMENT_LABELS[exercise.equipment]}
          {exercise.isCustom ? ' · personalizzato' : ''}
        </Text>
      </View>

      {trailing}

      {selectable ? (
        <MaterialCommunityIcons
          name={selected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
          size={24}
          color={selected ? theme.colors.accent : theme.colors.textFaint}
        />
      ) : onToggleFavorite ? (
        <IconButton
          icon={exercise.isFavorite ? 'star' : 'star-outline'}
          label={exercise.isFavorite ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
          tone={exercise.isFavorite ? 'accent' : 'dim'}
          onPress={onToggleFavorite}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
});

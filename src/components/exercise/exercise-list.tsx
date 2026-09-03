/**
 * Libreria esercizi con ricerca e filtri.
 *
 * Un componente solo per due usi: la scheda "Esercizi" (dove si tocca per
 * aprire il dettaglio) e il selettore usato da builder e sessione (dove si
 * tocca per scegliere). Cambia solo cosa fa `onSelect`.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { Text } from '@/components/ui/text';
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  type Equipment,
  type MuscleGroup,
} from '@/db/enums';
import { exerciseListQuery, toggleFavorite } from '@/db/queries/exercises';
import type { Exercise } from '@/db/schema';
import { useTheme } from '@/theme';
import { ExerciseRow } from './exercise-row';

export function ExerciseList({
  onSelect,
  /** Nasconde la stella: nel selettore il tap serve a scegliere, non a votare. */
  showFavoriteToggle = true,
  header,
  emptyAction,
}: {
  onSelect: (exercise: Exercise) => void;
  showFavoriteToggle?: boolean;
  header?: React.ReactNode;
  emptyAction?: { label: string; onPress: () => void };
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const query = useMemo(
    () => exerciseListQuery({ search, group, equipment, favoritesOnly }),
    [search, group, equipment, favoritesOnly],
  );
  const { data } = useLiveQuery(query, [search, group, equipment, favoritesOnly]);
  const items = data ?? [];

  const hasFilters = Boolean(search || group || equipment || favoritesOnly);

  return (
    <View style={styles.root}>
      {header}

      <View style={{ paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md }}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cerca esercizio o alias…" />
      </View>

      <View style={{ gap: theme.space.sm, paddingBottom: theme.space.md }}>
        <ChipRow>
          <Chip
            label="Preferiti"
            compact
            selected={favoritesOnly}
            onPress={() => setFavoritesOnly((v) => !v)}
          />
          {MUSCLE_GROUPS.map((g) => (
            <Chip
              key={g}
              label={MUSCLE_GROUP_LABELS[g]}
              compact
              selected={group === g}
              onPress={() => setGroup((cur) => (cur === g ? null : g))}
            />
          ))}
        </ChipRow>
        <ChipRow>
          {EQUIPMENT.map((e) => (
            <Chip
              key={e}
              label={EQUIPMENT_LABELS[e]}
              compact
              selected={equipment === e}
              onPress={() => setEquipment((cur) => (cur === e ? null : e))}
            />
          ))}
        </ChipRow>
      </View>

      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExerciseRow
            exercise={item}
            onPress={() => onSelect(item)}
            onToggleFavorite={
              showFavoriteToggle ? () => toggleFavorite(item.id, !item.isFavorite) : undefined
            }
          />
        )}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState
            icon={hasFilters ? 'magnify-close' : 'weight-lifter'}
            title={hasFilters ? 'Nessun risultato' : 'Libreria vuota'}
            description={
              hasFilters
                ? 'Prova con meno filtri o un altro nome — la ricerca guarda anche gli alias.'
                : 'Qualcosa è andato storto nel caricamento della libreria.'
            }
            actionLabel={emptyAction?.label}
            onAction={emptyAction?.onPress}
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Text
              variant="caption"
              tone="faint"
              style={[styles.footer, { padding: theme.space.lg }]}>
              {items.length === 1 ? '1 esercizio' : `${items.length} esercizi`}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  footer: { textAlign: 'center' },
});

/**
 * Libreria esercizi con ricerca e filtri.
 *
 * Un componente solo per due usi: la scheda "Esercizi" (dove si tocca per
 * aprire il dettaglio) e il selettore usato da builder e sessione (dove si
 * tocca per scegliere).
 *
 * Rende l'intera schermata, non solo la lista, perché ricerca e filtri devono
 * stare nell'header fisso: erano in cima allo scroll e sparivano al primo
 * scorrimento, così per cambiare un filtro dopo aver guardato i risultati
 * bisognava risalire tutta la lista.
 *
 * In `selection` la scelta diventa multipla e si conferma dalla barra in
 * fondo. Prima era a selezione singola: aggiungere sei esercizi a un giorno
 * voleva dire riaprire il selettore sei volte, riapplicando i filtri ogni volta.
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Chip, ChipRow } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, useScreenChrome } from '@/components/ui/screen';
import { ScreenHeader, type HeaderAction } from '@/components/ui/screen-header';
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

export type ExerciseSelection = {
  /** Etichetta dell'azione di conferma, in funzione di quanti sono scelti. */
  label: (count: number) => string;
  onConfirm: (ids: string[]) => void;
};

export function ExerciseList({
  title,
  showBack = false,
  actions,
  onSelect,
  /** Nasconde la stella: nel selettore il tap serve a scegliere, non a votare. */
  showFavoriteToggle = true,
  emptyAction,
  selection,
  /** Barra in fondo quando non si è in selezione multipla. */
  actionBar,
}: {
  title: string;
  showBack?: boolean;
  actions?: HeaderAction[];
  onSelect?: (exercise: Exercise) => void;
  showFavoriteToggle?: boolean;
  emptyAction?: { label: string; onPress: () => void };
  selection?: ExerciseSelection;
  actionBar?: React.ReactNode;
}) {
  const theme = useTheme();
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);

  const query = useMemo(
    () => exerciseListQuery({ search, group, equipment, favoritesOnly }),
    [search, group, equipment, favoritesOnly],
  );
  const { data } = useLiveQuery(query, [search, group, equipment, favoritesOnly]);
  const items = data ?? [];

  const hasFilters = Boolean(search || group || equipment || favoritesOnly);

  function toggle(id: string) {
    setChosen((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  const filters = (
    <View style={{ gap: theme.space.sm }}>
      <View style={{ paddingHorizontal: theme.space.lg }}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cerca esercizio o alias…" />
      </View>
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
  );

  const bottom = selection ? (
    <ActionBar>
      <View style={{ flex: 1 }}>
        <Button
          title={selection.label(chosen.length)}
          size="lg"
          fullWidth
          disabled={chosen.length === 0}
          onPress={() => selection.onConfirm(chosen)}
        />
      </View>
    </ActionBar>
  ) : (
    actionBar
  );

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader title={title} showBack={showBack} actions={actions} below={filters} />
      }
      actionBar={bottom}>
      <ExerciseFlashList
        items={items}
        hasFilters={hasFilters}
        emptyAction={emptyAction}
        renderRow={(item) => (
          <ExerciseRow
            exercise={item}
            selectable={Boolean(selection)}
            selected={chosen.includes(item.id)}
            onPress={() => (selection ? toggle(item.id) : onSelect?.(item))}
            onToggleFavorite={
              showFavoriteToggle && !selection
                ? () => toggleFavorite(item.id, !item.isFavorite)
                : undefined
            }
          />
        )}
      />
    </Screen>
  );
}

/**
 * Separata perché `useScreenChrome()` va letto *dentro* `Screen`: è lì che il
 * contesto esiste. Serve a non far finire la prima riga sotto l'header e
 * l'ultima sotto la barra delle azioni.
 */
function ExerciseFlashList({
  items,
  hasFilters,
  emptyAction,
  renderRow,
}: {
  items: Exercise[];
  hasFilters: boolean;
  emptyAction?: { label: string; onPress: () => void };
  renderRow: (item: Exercise) => React.ReactElement;
}) {
  const theme = useTheme();
  const chrome = useScreenChrome();

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => renderRow(item)}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: chrome.top, paddingBottom: chrome.bottom }}
      scrollIndicatorInsets={{ top: chrome.top, bottom: chrome.bottom }}
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
          <Text variant="caption" tone="faint" style={[styles.footer, { padding: theme.space.lg }]}>
            {items.length === 1 ? '1 esercizio' : `${items.length} esercizi`}
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center' },
});

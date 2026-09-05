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
  MUSCLES,
  MUSCLE_LABELS,
  type Equipment,
  type Muscle,
} from '@/db/enums';
import { exerciseListQuery, toggleFavorite } from '@/db/queries/exercises';
import type { Exercise } from '@/db/schema';
import { useTheme } from '@/theme';
import { ExerciseRow } from './exercise-row';

/**
 * La lista è piatta ma mista: le intestazioni sono righe come le altre, così
 * resta una `FlashList` sola (con `getItemType` a tenere separati i due
 * riciclaggi) invece di una `SectionList`, che qui costerebbe scorrimento.
 */
type ListRow =
  | { kind: 'header'; muscle: Muscle }
  | { kind: 'exercise'; exercise: Exercise };

/**
 * Raggruppa per muscolo nell'ordine di `MUSCLES`, che è anatomico: petto,
 * spalle, schiena, braccia, gambe, core. In ordine alfabetico gli addominali
 * finirebbero prima dei bicipiti e i polpacci in mezzo alle spalle.
 *
 * I muscoli senza esercizi non fanno sezione: la libreria non ha nulla per il
 * collo, e un'intestazione vuota sarebbe solo un buco.
 */
function groupByMuscle(items: Exercise[]): ListRow[] {
  // Una passata sola sugli esercizi, poi una sui muscoli per l'ordine: la
  // libreria si rigruppa a ogni lettera digitata nella ricerca, e filtrarla
  // venti volte — una per muscolo — era venti passate a ogni tasto.
  const byMuscle = new Map<Muscle, Exercise[]>();
  for (const exercise of items) {
    const group = byMuscle.get(exercise.primaryMuscle);
    if (group) group.push(exercise);
    else byMuscle.set(exercise.primaryMuscle, [exercise]);
  }

  const rows: ListRow[] = [];
  for (const muscle of MUSCLES) {
    const group = byMuscle.get(muscle);
    if (!group) continue;

    rows.push({ kind: 'header', muscle });
    for (const exercise of group) rows.push({ kind: 'exercise', exercise });
  }

  return rows;
}

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
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);

  const query = useMemo(
    () => exerciseListQuery({ search, muscle, equipment, favoritesOnly }),
    [search, muscle, equipment, favoritesOnly],
  );
  const { data } = useLiveQuery(query, [search, muscle, equipment, favoritesOnly]);
  const items = data ?? [];

  const hasFilters = Boolean(search || muscle || equipment || favoritesOnly);

  // Le intestazioni servono a chi sfoglia: sono l'unico modo per non leggere
  // centoquaranta nomi di fila. A chi cerca no — i risultati sono pochi e
  // sparsi, e verrebbe fuori un'intestazione per riga — e con un muscolo già
  // scelto nemmeno, perché la lista è già tutta di quel muscolo.
  const grouped = !muscle && !search.trim();
  const rows = useMemo<ListRow[]>(
    () =>
      grouped
        ? groupByMuscle(items)
        : items.map((exercise) => ({ kind: 'exercise', exercise })),
    [items, grouped],
  );

  function toggle(id: string) {
    setChosen((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  const filters = (
    <View style={{ gap: theme.space.sm }}>
      <View style={{ paddingHorizontal: theme.space.sm }}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Cerca esercizio o alias…" />
      </View>
      <ChipRow>
        <Chip
          label="Preferiti"
          compact
          selected={favoritesOnly}
          onPress={() => setFavoritesOnly((v) => !v)}
        />
        {MUSCLES.map((m) => (
          <Chip
            key={m}
            label={MUSCLE_LABELS[m]}
            compact
            selected={muscle === m}
            onPress={() => setMuscle((cur) => (cur === m ? null : m))}
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
        rows={rows}
        count={items.length}
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
  rows,
  count,
  hasFilters,
  emptyAction,
  renderRow,
}: {
  rows: ListRow[];
  /** Quanti esercizi, senza contare le intestazioni. */
  count: number;
  hasFilters: boolean;
  emptyAction?: { label: string; onPress: () => void };
  renderRow: (item: Exercise) => React.ReactElement;
}) {
  const theme = useTheme();
  const chrome = useScreenChrome();

  return (
    <FlashList
      data={rows}
      keyExtractor={(row) => (row.kind === 'header' ? `muscolo:${row.muscle}` : row.exercise.id)}
      getItemType={(row) => row.kind}
      renderItem={({ item: row }) =>
        row.kind === 'header' ? (
          <Text
            variant="label"
            tone="dim"
            style={{
              paddingTop: theme.space.lg,
              paddingBottom: theme.space.sm,
              paddingHorizontal: theme.space.lg,
            }}>
            {MUSCLE_LABELS[row.muscle]}
          </Text>
        ) : (
          renderRow(row.exercise)
        )
      }
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
        count > 0 ? (
          <Text variant="caption" tone="faint" style={[styles.footer, { padding: theme.space.lg }]}>
            {count === 1 ? '1 esercizio' : `${count} esercizi`}
          </Text>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center' },
});

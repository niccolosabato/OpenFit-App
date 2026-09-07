import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confirm } from '@/components/ui/confirm';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import {
  createDay,
  deleteRoutine,
  routineDaysWithCountQuery,
  routineQuery,
  updateRoutine,
} from '@/db/queries/routines';
import { startSessionFromDay } from '@/db/queries/sessions';
import { startWorkout } from '@/features/session/start';
import { pluralize } from '@/lib/format';
import { capsule, useTheme } from '@/theme';

export default function RoutineScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: routineRows } = useLiveQuery(useMemo(() => routineQuery(id), [id]), [id]);
  const { data: dayRows } = useLiveQuery(
    useMemo(() => routineDaysWithCountQuery(id), [id]),
    [id],
  );

  const routine = routineRows?.[0];
  const days = dayRows ?? [];

  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState('');
  const [newDayOpen, setNewDayOpen] = useState(false);
  const [dayName, setDayName] = useState('');

  if (!routine) {
    return (
      <Screen padded={false} header={<ScreenHeader title="Scheda" showBack />}>
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Scheda non trovata.
        </Text>
      </Screen>
    );
  }

  function openDay(dayId: string) {
    router.push({ pathname: '/routine/[id]/day/[dayId]', params: { id, dayId } });
  }

  function confirmDelete() {
    setMenuOpen(false);
    confirm({
      title: 'Eliminare la scheda?',
      message:
        'Sparisce con tutti i suoi giorni ed esercizi. Le sessioni già registrate restano nello storico.',
      action: {
        label: 'Elimina',
        destructive: true,
        onPress: () => {
          deleteRoutine(id);
          router.back();
        },
      },
    });
  }

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={routine.name}
          subtitle={pluralize(days.length, 'giorno', 'giorni')}
          showBack
          actions={[{ icon: 'dots-horizontal', label: 'Opzioni', onPress: () => setMenuOpen(true) }]}
        />
      }
      actionBar={
        <ActionBar>
          <View style={{ flex: 1 }}>
            <Button title="Aggiungi un giorno" size="lg" fullWidth onPress={() => setNewDayOpen(true)} />
          </View>
        </ActionBar>
      }>
      {days.length === 0 ? (
        <EmptyState
          icon="calendar-blank-outline"
          title="Nessun giorno"
          description="Un giorno è una seduta: Spinta, Trazione, Gambe… Aggiungine uno per iniziare a metterci gli esercizi."
          actionLabel="Aggiungi un giorno"
          onAction={() => setNewDayOpen(true)}
        />
      ) : (
        <ScreenScroll gap={theme.space.md}>
          {days.map((entry, index) => (
            <Card key={entry.day.id} padded={false} onPress={() => openDay(entry.day.id)}>
              <View style={[styles.dayRow, { padding: theme.space.md, gap: theme.space.md }]}>
                <Surface level="mid" radius={theme.radius.md} bordered={false} style={styles.ordinal}>
                  <Text variant="metric" tone="accent" numeric>
                    {index + 1}
                  </Text>
                </Surface>

                <View style={{ flex: 1, gap: theme.space.xs }}>
                  <Text variant="heading" numberOfLines={1}>
                    {entry.day.name}
                  </Text>
                  <Text variant="caption" tone="faint" numberOfLines={1}>
                    {entry.day.notes || pluralize(entry.exerciseCount, 'esercizio', 'esercizi')}
                  </Text>
                </View>

                {/* Far partire un giorno da qui evita il giro "apri il giorno,
                    scorri in fondo, tocca inizia" quando la scheda è già a
                    posto e si è solo venuti a vedere cosa tocca oggi. */}
                {entry.exerciseCount > 0 ? (
                  <Pressable
                    onPress={() => startWorkout(() => startSessionFromDay(entry.day.id))}
                    accessibilityRole="button"
                    accessibilityLabel={`Inizia ${entry.day.name}`}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}>
                    <View
                      style={[
                        styles.play,
                        { borderRadius: capsule(PLAY), backgroundColor: theme.colors.accent },
                      ]}>
                      <MaterialCommunityIcons
                        name="play"
                        size={22}
                        color={theme.colors.onAccent}
                      />
                    </View>
                  </Pressable>
                ) : (
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={theme.colors.textFaint}
                  />
                )}
              </View>
            </Card>
          ))}
        </ScreenScroll>
      )}

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={routine.name} scrollable={false}>
        <SheetAction
          label="Rinomina"
          onPress={() => {
            setName(routine!.name);
            setMenuOpen(false);
            setRenameOpen(true);
          }}
        />
        <SheetAction label="Elimina scheda" destructive onPress={confirmDelete} />
      </Sheet>

      <Sheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Rinomina" scrollable={false}>
        <TextField label="Nome" value={name} onChangeText={setName} autoFocus />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            if (name.trim()) updateRoutine(id, { name: name.trim() });
            setRenameOpen(false);
          }}
        />
      </Sheet>

      <Sheet visible={newDayOpen} onClose={() => setNewDayOpen(false)} title="Nuovo giorno" scrollable={false}>
        <TextField
          label="Nome del giorno"
          value={dayName}
          onChangeText={setDayName}
          placeholder="Es. A — Spinta"
          autoFocus
        />
        <Button
          title="Aggiungi"
          fullWidth
          onPress={() => {
            const created = createDay(id, dayName.trim() || `Giorno ${days.length + 1}`);
            setDayName('');
            setNewDayOpen(false);
            openDay(created);
          }}
        />
      </Sheet>
    </Screen>
  );
}

/** Il bersaglio del play: 48, come tutto ciò che si tocca in palestra. */
const PLAY = 48;

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  ordinal: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  play: { width: PLAY, height: PLAY, alignItems: 'center', justifyContent: 'center' },
});

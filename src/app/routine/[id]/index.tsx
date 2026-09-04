import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/field';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import {
  createDay,
  deleteRoutine,
  routineDaysQuery,
  routineQuery,
  updateRoutine,
} from '@/db/queries/routines';
import { useTheme } from '@/theme';

export default function RoutineScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: routineRows } = useLiveQuery(useMemo(() => routineQuery(id), [id]), [id]);
  const { data: dayRows } = useLiveQuery(useMemo(() => routineDaysQuery(id), [id]), [id]);

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
    Alert.alert(
      'Eliminare la scheda?',
      'Sparisce con tutti i suoi giorni ed esercizi. Le sessioni già registrate restano nello storico.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            deleteRoutine(id);
            router.back();
          },
        },
      ],
    );
  }

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={routine.name}
          subtitle={`${days.length} ${days.length === 1 ? 'giorno' : 'giorni'}`}
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
          {days.map((day, index) => (
            <Card key={day.id} onPress={() => openDay(day.id)}>
              <View style={styles.dayRow}>
                <Text variant="label" tone="accent">
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="heading" numberOfLines={1}>
                    {day.name}
                  </Text>
                  {day.notes ? (
                    <Text variant="caption" tone="dim" numberOfLines={1}>
                      {day.notes}
                    </Text>
                  ) : null}
                </View>
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

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/chip';
import { TextField } from '@/components/ui/field';
import { NumberStepper } from '@/components/ui/number-stepper';
import { RoutineSetEditor } from '@/components/routine/routine-set-editor';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { SET_TYPE_BADGE, TECHNIQUE_LABELS } from '@/db/enums';
import {
  addRoutineSet,
  dayExercisesQuery,
  dayRoutineSetsQuery,
  deleteDay,
  deleteRoutineSet,
  moveRoutineExercise,
  removeRoutineExercise,
  routineDayQuery,
  toggleSupersetWithPrevious,
  updateDay,
  updateRoutineExercise,
  updateRoutineSet,
} from '@/db/queries/routines';
import type { RoutineExercise, RoutineSet } from '@/db/schema';
import { startSessionFromDay } from '@/db/queries/sessions';
import { startWorkout } from '@/features/session/start';
import { formatRest } from '@/lib/format';
import { describeRoutineSet } from '@/lib/set-summary';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function RoutineDayScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { id, dayId } = useLocalSearchParams<{ id: string; dayId: string }>();

  const { data: dayRows } = useLiveQuery(useMemo(() => routineDayQuery(dayId), [dayId]), [dayId]);
  const { data: exerciseRows } = useLiveQuery(useMemo(() => dayExercisesQuery(dayId), [dayId]), [dayId]);
  const { data: setRows } = useLiveQuery(useMemo(() => dayRoutineSetsQuery(dayId), [dayId]), [dayId]);

  const day = dayRows?.[0];
  const items = exerciseRows ?? [];

  /** Serie raggruppate per esercizio: una query sola, poi si smista in memoria. */
  const setsByExercise = useMemo(() => {
    const map = new Map<string, RoutineSet[]>();
    for (const row of setRows ?? []) {
      const list = map.get(row.set.routineExerciseId) ?? [];
      list.push(row.set);
      map.set(row.set.routineExerciseId, list);
    }
    return map;
  }, [setRows]);

  const [menuFor, setMenuFor] = useState<RoutineExercise | null>(null);
  const [restFor, setRestFor] = useState<RoutineExercise | null>(null);
  const [restValue, setRestValue] = useState<number | null>(90);
  const [notesFor, setNotesFor] = useState<RoutineExercise | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [editingSet, setEditingSet] = useState<RoutineSet | null>(null);
  const [editingTracking, setEditingTracking] = useState<'weight_reps' | string>('weight_reps');
  const [renameOpen, setRenameOpen] = useState(false);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);
  const [dayName, setDayName] = useState('');

  if (!day) {
    return (
      <Screen padded={false} header={<ScreenHeader title="Giorno" showBack />}>
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Giorno non trovato.
        </Text>
      </Screen>
    );
  }

  const totalSets = setRows?.length ?? 0;

  function confirmDeleteDay() {
    Alert.alert('Eliminare il giorno?', 'Sparisce con tutti i suoi esercizi.', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Elimina',
        style: 'destructive',
        onPress: () => {
          deleteDay(dayId);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={day.name}
          subtitle={`${items.length} ${items.length === 1 ? 'esercizio' : 'esercizi'} · ${totalSets} ${totalSets === 1 ? 'serie' : 'serie'}`}
          showBack
          // Nell'header resta solo ciò che non fa danni. "Elimina giorno" era
          // qui, a un tocco dal pollice che regge il telefono: ora sta nel
          // menu del giorno, dove ci si arriva di proposito.
          actions={[
            {
              icon: 'dots-horizontal',
              label: 'Opzioni del giorno',
              onPress: () => setDayMenuOpen(true),
            },
          ]}
        />
      }
      // L'azione più importante della schermata era l'ultimo elemento dello
      // scroll: con otto esercizi da quattro serie stava due schermate più in
      // basso. Qui è sempre sotto il pollice.
      actionBar={
        <ActionBar>
          <Button
            title="Esercizio"
            variant="secondary"
            icon={<MaterialCommunityIcons name="plus" size={18} color={theme.colors.text} />}
            onPress={() => router.push({ pathname: '/exercise/picker', params: { dayId } })}
          />
          {items.length > 0 ? (
            <View style={{ flex: 1 }}>
              <Button
                title="Inizia questo allenamento"
                size="lg"
                fullWidth
                onPress={() => startWorkout(() => startSessionFromDay(dayId))}
              />
            </View>
          ) : null}
        </ActionBar>
      }>
      <ScreenScroll gap={theme.space.md}>
        {items.map((item, index) => {
          const sets = setsByExercise.get(item.routineExercise.id) ?? [];
          const previous = items[index - 1];
          const inSupersetWithPrevious =
            item.routineExercise.supersetGroup !== null &&
            item.routineExercise.supersetGroup === previous?.routineExercise.supersetGroup;

          let workingIndex = 0;

          return (
            <View key={item.routineExercise.id} style={{ gap: theme.space.sm }}>
              {inSupersetWithPrevious ? (
                <View style={[styles.supersetLink, { gap: theme.space.sm }]}>
                  <View style={{ width: 2, height: 14, backgroundColor: theme.colors.accent }} />
                  <Text variant="label" tone="accent">
                    in superset
                  </Text>
                </View>
              ) : null}

              <Card padded={false}>
                <Pressable
                  onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.exercise.id } })}
                  onLongPress={() => setMenuFor(item.routineExercise)}
                  style={{ padding: theme.space.lg, gap: 4 }}>
                  <View style={styles.cardHead}>
                    <Text variant="heading" style={{ flex: 1 }} numberOfLines={2}>
                      {item.exercise.name}
                    </Text>
                    <IconButton
                      icon="dots-horizontal"
                      label="Opzioni esercizio"
                      tone="dim"
                      onPress={() => setMenuFor(item.routineExercise)}
                    />
                  </View>
                  <Text variant="caption" tone="faint">
                    Recupero {formatRest(item.routineExercise.restSeconds ?? settings.defaultRestSeconds)}
                    {item.routineExercise.notes ? ` · ${item.routineExercise.notes}` : ''}
                  </Text>
                </Pressable>

                <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.glass.stroke }}>
                  {sets.map((set) => {
                    if (set.setType === 'working') workingIndex += 1;
                    const badge = SET_TYPE_BADGE[set.setType];

                    return (
                      <Pressable
                        key={set.id}
                        onPress={() => {
                          setEditingTracking(item.exercise.trackingType);
                          setEditingSet(set);
                        }}
                        style={({ pressed }) => [
                          styles.setRow,
                          {
                            minHeight: 52,
                            paddingHorizontal: theme.space.lg,
                            borderTopColor: theme.glass.stroke,
                            gap: theme.space.md,
                          },
                          pressed && { backgroundColor: theme.glass.fillPress },
                        ]}>
                        <View style={styles.setIndex}>
                          {set.setType === 'working' ? (
                            <Text variant="caption" tone="dim" numeric>
                              {workingIndex}
                            </Text>
                          ) : (
                            <Tag label={badge} />
                          )}
                        </View>

                        <Text variant="body" numeric style={{ flex: 1 }}>
                          {describeRoutineSet(set, item.exercise.trackingType, settings.effortScale, settings.unit)}
                        </Text>

                        {set.technique ? <Tag label={TECHNIQUE_LABELS[set.technique]} color={theme.colors.accent} /> : null}
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => addRoutineSet(item.routineExercise.id)}
                    style={({ pressed }) => [
                      styles.addSet,
                      {
                        minHeight: 52,
                        borderTopColor: theme.glass.stroke,
                        gap: theme.space.sm,
                      },
                      pressed && { backgroundColor: theme.glass.fillPress },
                    ]}>
                    <MaterialCommunityIcons name="plus" size={16} color={theme.colors.accent} />
                    <Text variant="caption" tone="accent">
                      Aggiungi serie
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </View>
          );
        })}

      </ScreenScroll>

      {/* ──────────────────────────────────────────────── opzioni del giorno ── */}
      <Sheet
        visible={dayMenuOpen}
        onClose={() => setDayMenuOpen(false)}
        title={day.name}
        scrollable={false}>
        <SheetAction
          label="Rinomina il giorno"
          onPress={() => {
            setDayMenuOpen(false);
            setDayName(day!.name);
            setRenameOpen(true);
          }}
        />
        <SheetAction
          label="Elimina il giorno"
          description="Sparisce con tutti i suoi esercizi."
          destructive
          onPress={() => {
            setDayMenuOpen(false);
            confirmDeleteDay();
          }}
        />
      </Sheet>

      {/* ─────────────────────────────────────────── opzioni di un esercizio ── */}
      <Sheet visible={menuFor !== null} onClose={() => setMenuFor(null)} title="Esercizio" scrollable={false}>
        <SheetAction
          label="Sposta su"
          onPress={() => {
            if (menuFor) moveRoutineExercise(dayId, menuFor.id, -1);
            setMenuFor(null);
          }}
        />
        <SheetAction
          label="Sposta giù"
          onPress={() => {
            if (menuFor) moveRoutineExercise(dayId, menuFor.id, 1);
            setMenuFor(null);
          }}
        />
        <SheetAction
          label="Superset con il precedente"
          description="Li alterni senza recupero; il timer parte a fine giro."
          onPress={() => {
            if (menuFor) toggleSupersetWithPrevious(dayId, menuFor.id);
            setMenuFor(null);
          }}
        />
        <SheetAction
          label="Recupero"
          onPress={() => {
            if (menuFor) {
              setRestValue(menuFor.restSeconds ?? settings.defaultRestSeconds);
              setRestFor(menuFor);
            }
            setMenuFor(null);
          }}
        />
        <SheetAction
          label="Note"
          onPress={() => {
            if (menuFor) {
              setNotesValue(menuFor.notes ?? '');
              setNotesFor(menuFor);
            }
            setMenuFor(null);
          }}
        />
        <SheetAction
          label="Rimuovi dal giorno"
          destructive
          onPress={() => {
            if (menuFor) removeRoutineExercise(menuFor.id);
            setMenuFor(null);
          }}
        />
      </Sheet>

      <Sheet visible={restFor !== null} onClose={() => setRestFor(null)} title="Recupero" scrollable={false}>
        <NumberStepper
          value={restValue}
          onChange={setRestValue}
          step={15}
          min={0}
          max={600}
          suffix="s"
        />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            if (restFor) updateRoutineExercise(restFor.id, { restSeconds: restValue });
            setRestFor(null);
          }}
        />
      </Sheet>

      <Sheet visible={notesFor !== null} onClose={() => setNotesFor(null)} title="Note" scrollable={false}>
        <TextField
          label="Promemoria per questo esercizio"
          value={notesValue}
          onChangeText={setNotesValue}
          placeholder="Setup, presa, accorgimenti…"
          multiline
          autoFocus
        />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            if (notesFor) updateRoutineExercise(notesFor.id, { notes: notesValue.trim() || null });
            setNotesFor(null);
          }}
        />
      </Sheet>

      <RoutineSetEditor
        set={editingSet}
        tracking={editingTracking as never}
        onClose={() => setEditingSet(null)}
        onSave={(patch) => {
          if (editingSet) updateRoutineSet(editingSet.id, patch);
        }}
        onDelete={() => {
          if (editingSet) deleteRoutineSet(editingSet.id);
          setEditingSet(null);
        }}
      />

      <Sheet visible={renameOpen} onClose={() => setRenameOpen(false)} title="Rinomina giorno" scrollable={false}>
        <TextField label="Nome" value={dayName} onChangeText={setDayName} autoFocus />
        <Button
          title="Salva"
          fullWidth
          onPress={() => {
            if (dayName.trim()) updateDay(dayId, { name: dayName.trim() });
            setRenameOpen(false);
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  supersetLink: { flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
  setRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  setIndex: { width: 30, alignItems: 'center' },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

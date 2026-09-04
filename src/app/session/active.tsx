import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import {
  PLATE_LOADED_EQUIPMENT,
  SET_TYPE_LABELS,
  TECHNIQUES,
  TECHNIQUE_CHILD_TYPE,
  TECHNIQUE_DESCRIPTIONS,
  TECHNIQUE_LABELS,
  TOP_LEVEL_SET_TYPES,
  countsAsWorkingSet,
  type SetType,
} from '@/db/enums';
import {
  activeSessionQuery,
  addChildSet,
  addSessionSet,
  computeTotals,
  deleteSessionSet,
  discardSession,
  finishSession,
  getPreviousPerformance,
  moveSessionExercise,
  removeSessionExercise,
  sessionExercisesQuery,
  sessionSetsQuery,
  updateSessionSet,
} from '@/db/queries/sessions';
import type { SessionExercise, SessionSet } from '@/db/schema';
import { PlateSheet } from '@/features/session/plate-sheet';
import { completeSet, uncompleteSet, type SetValues } from '@/features/session/actions';
import { describeRecordHits } from '@/features/session/record-message';
import { SetRow, SetRowHeader } from '@/features/session/set-row';
import { RestTimerBar } from '@/features/timer/rest-timer-bar';
import { tapFeedback, useRestTimer } from '@/features/timer/rest-timer';
import { formatDuration } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function ActiveSessionScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const showToast = useToast((s) => s.show);
  const startRest = useRestTimer((s) => s.start);

  const { data: sessionRows } = useLiveQuery(activeSessionQuery());
  const session = sessionRows?.[0];
  const sessionId = session?.id ?? '';

  const { data: exerciseRows } = useLiveQuery(
    useMemo(() => sessionExercisesQuery(sessionId), [sessionId]),
    [sessionId],
  );
  const { data: setRows } = useLiveQuery(
    useMemo(() => sessionSetsQuery(sessionId), [sessionId]),
    [sessionId],
  );

  const items = exerciseRows ?? [];
  const allSets = useMemo(() => (setRows ?? []).map((r) => r.set), [setRows]);

  const [elapsed, setElapsed] = useState(0);
  const [menuSet, setMenuSet] = useState<SessionSet | null>(null);
  const [menuExercise, setMenuExercise] = useState<SessionExercise | null>(null);
  const [plateFor, setPlateFor] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);

  // Lo schermo resta acceso per tutta la seduta: fra una serie e l'altra il
  // telefono è appoggiato sulla panca e riaccenderlo ogni volta è un attrito.
  useEffect(() => {
    if (!session || !settings.keepAwake) return;
    activateKeepAwakeAsync('openfit-session').catch(() => {});
    return () => {
      deactivateKeepAwake('openfit-session');
    };
  }, [session, settings.keepAwake]);

  // Durata della seduta, ricalcolata dall'orario di inizio (non accumulata):
  // resta giusta anche se l'app è stata in background.
  useEffect(() => {
    if (!session) return;
    const update = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - session.startedAt.getTime()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  /** Prestazione precedente per ogni esercizio, una lettura sola all'apertura. */
  const previousByExercise = useMemo(() => {
    const map = new Map<string, SessionSet[]>();
    for (const item of items) {
      const previous = getPreviousPerformance(item.exercise.id, sessionId);
      map.set(item.exercise.id, previous?.sets ?? []);
    }
    return map;
  }, [items, sessionId]);

  const setsByExercise = useMemo(() => {
    const map = new Map<string, SessionSet[]>();
    for (const set of allSets) {
      const list = map.get(set.sessionExerciseId) ?? [];
      list.push(set);
      map.set(set.sessionExerciseId, list);
    }
    return map;
  }, [allSets]);

  const totals = useMemo(() => computeTotals(allSets), [allSets]);

  if (!session) {
    return (
      <Screen>
        <EmptyState
          icon="dumbbell"
          title="Nessun allenamento in corso"
          description="Parti da un giorno di una scheda oppure comincia libero."
          actionLabel="Torna indietro"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  /**
   * Fa partire il recupero dopo una serie.
   *
   * In un superset il timer non parte a ogni esercizio: si aspetta la fine del
   * giro, altrimenti il recupero scatterebbe nel momento in cui si dovrebbe
   * passare all'esercizio successivo.
   */
  function startRestFor(sessionExerciseId: string) {
    if (!settings.autoStartTimer) return;

    const index = items.findIndex((i) => i.sessionExercise.id === sessionExerciseId);
    if (index < 0) return;

    const current = items[index];
    const next = items[index + 1];
    const inSupersetWithNext =
      current.sessionExercise.supersetGroup !== null &&
      current.sessionExercise.supersetGroup === next?.sessionExercise.supersetGroup;
    if (inSupersetWithNext) return;

    const seconds = current.sessionExercise.restSeconds ?? settings.defaultRestSeconds;
    startRest(seconds, current.exercise.name, {
      sound: settings.timerSound,
      notify: settings.timerNotification,
    });
  }

  function handleComplete(set: SessionSet, exerciseId: string, values: SetValues) {
    const hits = completeSet(set, exerciseId, sessionId, values);
    tapFeedback(settings.timerVibration);

    const message = describeRecordHits(hits, settings.unit);
    if (message) showToast(message.title, { detail: message.detail, tone: 'record' });

    startRestFor(set.sessionExerciseId);
  }

  function confirmFinish() {
    if (totals.totalSets === 0) {
      Alert.alert(
        'Nessuna serie completata',
        'Non c’è niente da salvare. Vuoi scartare questo allenamento?',
        [
          { text: 'Continua', style: 'cancel' },
          {
            text: 'Scarta',
            style: 'destructive',
            onPress: () => {
              discardSession(sessionId);
              router.back();
            },
          },
        ],
      );
      return;
    }
    setFinishOpen(true);
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: theme.space.lg, paddingTop: theme.space.md, gap: theme.space.md }}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Riduci a icona">
            <MaterialCommunityIcons name="chevron-down" size={28} color={theme.colors.text} />
          </Pressable>
          <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
            {session.name}
          </Text>
          <Button title="Termina" size="sm" onPress={confirmFinish} />
        </View>

        <View style={styles.statsRow}>
          <Stat label="Durata" value={formatDuration(elapsed)} />
          <Stat label="Volume" value={formatVolume(totals.totalVolume, settings.unit)} />
          <Stat label="Serie" value={String(totals.totalSets)} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md, paddingBottom: theme.space.xxxl * 2 }}
        keyboardShouldPersistTaps="handled">
        {items.length === 0 ? (
          <EmptyState
            icon="plus-circle-outline"
            title="Allenamento vuoto"
            description="Aggiungi il primo esercizio per cominciare a registrare."
            actionLabel="Aggiungi esercizio"
            onAction={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
          />
        ) : (
          items.map((item, index) => {
            const sets = setsByExercise.get(item.sessionExercise.id) ?? [];
            const topLevel = sets.filter((s) => s.parentSetId === null);
            const previousSets = previousByExercise.get(item.exercise.id) ?? [];
            const previousItem = items[index - 1];
            const inSupersetWithPrevious =
              item.sessionExercise.supersetGroup !== null &&
              item.sessionExercise.supersetGroup === previousItem?.sessionExercise.supersetGroup;

            let workingIndex = 0;
            let previousIndex = 0;

            return (
              <View key={item.sessionExercise.id} style={{ gap: theme.space.sm }}>
                {inSupersetWithPrevious ? (
                  <View style={[styles.supersetLink, { gap: theme.space.sm }]}>
                    <View style={{ width: 2, height: 14, backgroundColor: theme.colors.accent }} />
                    <Text variant="label" tone="accent">
                      in superset
                    </Text>
                  </View>
                ) : null}

                <Card padded={false}>
                  <View style={[styles.cardHead, { padding: theme.space.md, gap: theme.space.sm }]}>
                    <Pressable
                      onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.exercise.id } })}
                      style={{ flex: 1 }}>
                      <Text variant="subtitle" numberOfLines={2}>
                        {item.exercise.name}
                      </Text>
                      {item.sessionExercise.notes ? (
                        <Text variant="caption" tone="faint" numberOfLines={1}>
                          {item.sessionExercise.notes}
                        </Text>
                      ) : null}
                    </Pressable>

                    {PLATE_LOADED_EQUIPMENT.includes(item.exercise.equipment) ? (
                      <Pressable
                        onPress={() => {
                          const reference = topLevel.find((s) => s.weight)?.weight ?? settings.barWeight;
                          setPlateFor(reference);
                        }}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Calcolatore dischi">
                        <MaterialCommunityIcons name="circle-slice-8" size={20} color={theme.colors.textDim} />
                      </Pressable>
                    ) : null}

                    <Pressable
                      onPress={() => setMenuExercise(item.sessionExercise)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel="Opzioni esercizio">
                      <MaterialCommunityIcons name="dots-horizontal" size={22} color={theme.colors.textDim} />
                    </Pressable>
                  </View>

                  <SetRowHeader
                    tracking={item.exercise.trackingType}
                    effortScale={settings.effortScale}
                    unit={settings.unit}
                  />

                  {topLevel.map((set) => {
                    if (countsAsWorkingSet(set.setType)) workingIndex += 1;
                    const previous =
                      countsAsWorkingSet(set.setType) && previousSets[previousIndex]
                        ? previousSets[previousIndex++]
                        : null;
                    const children = sets.filter((s) => s.parentSetId === set.id);

                    return (
                      <View key={set.id}>
                        <SetRow
                          set={set}
                          tracking={item.exercise.trackingType}
                          workingIndex={workingIndex}
                          previous={previous}
                          unit={settings.unit}
                          effortScale={settings.effortScale}
                          prefill={settings.prefillFromPrevious}
                          onComplete={(values) => handleComplete(set, item.exercise.id, values)}
                          onUncomplete={() => uncompleteSet(set.id)}
                          onOpenMenu={() => setMenuSet(set)}
                          onChange={(values) => updateSessionSet(set.id, values)}
                        />
                        {children.map((child) => (
                          <SetRow
                            key={child.id}
                            set={child}
                            tracking={item.exercise.trackingType}
                            workingIndex={0}
                            previous={null}
                            unit={settings.unit}
                            effortScale={settings.effortScale}
                            isChild
                            onComplete={(values) => handleComplete(child, item.exercise.id, values)}
                            onUncomplete={() => uncompleteSet(child.id)}
                            onOpenMenu={() => setMenuSet(child)}
                            onChange={(values) => updateSessionSet(child.id, values)}
                          />
                        ))}
                      </View>
                    );
                  })}

                  <Pressable
                    onPress={() => addSessionSet(item.sessionExercise.id)}
                    style={({ pressed }) => [
                      styles.addSet,
                      { minHeight: 44, borderTopColor: theme.colors.border, gap: theme.space.sm },
                      pressed && { backgroundColor: theme.colors.surface2 },
                    ]}>
                    <MaterialCommunityIcons name="plus" size={16} color={theme.colors.accent} />
                    <Text variant="caption" tone="accent">
                      Aggiungi serie
                    </Text>
                  </Pressable>
                </Card>
              </View>
            );
          })
        )}

        {items.length > 0 ? (
          <Button
            title="Aggiungi esercizio"
            variant="secondary"
            fullWidth
            onPress={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
          />
        ) : null}
      </ScrollView>

      <RestTimerBar />

      {/* ───────────────────────────────────────────── menu di una serie ── */}
      <Sheet visible={menuSet !== null} onClose={() => setMenuSet(null)} title="Serie">
        <Text variant="label" tone="dim">
          Tipo
        </Text>
        {TOP_LEVEL_SET_TYPES.map((type) => (
          <SheetAction
            key={type}
            label={SET_TYPE_LABELS[type]}
            selected={menuSet?.setType === type}
            onPress={() => {
              if (menuSet) updateSessionSet(menuSet.id, { setType: type as SetType });
              setMenuSet(null);
            }}
          />
        ))}

        <Text variant="label" tone="dim" style={{ marginTop: theme.space.md }}>
          Estendi la serie
        </Text>
        {TECHNIQUES.map((technique) => (
          <SheetAction
            key={technique}
            label={`Aggiungi ${TECHNIQUE_LABELS[technique]}`}
            description={TECHNIQUE_DESCRIPTIONS[technique]}
            onPress={() => {
              if (menuSet) addChildSet(menuSet, technique, TECHNIQUE_CHILD_TYPE[technique]);
              setMenuSet(null);
            }}
          />
        ))}

        <SheetAction
          label="Elimina serie"
          destructive
          onPress={() => {
            if (menuSet) deleteSessionSet(menuSet.id);
            setMenuSet(null);
          }}
        />
      </Sheet>

      {/* ──────────────────────────────────────── menu di un esercizio ── */}
      <Sheet visible={menuExercise !== null} onClose={() => setMenuExercise(null)} title="Esercizio" scrollable={false}>
        <SheetAction
          label="Sposta su"
          onPress={() => {
            if (menuExercise) moveSessionExercise(sessionId, menuExercise.id, -1);
            setMenuExercise(null);
          }}
        />
        <SheetAction
          label="Sposta giù"
          onPress={() => {
            if (menuExercise) moveSessionExercise(sessionId, menuExercise.id, 1);
            setMenuExercise(null);
          }}
        />
        <SheetAction
          label="Rimuovi dall’allenamento"
          destructive
          onPress={() => {
            if (menuExercise) removeSessionExercise(menuExercise.id);
            setMenuExercise(null);
          }}
        />
      </Sheet>

      <PlateSheet
        targetWeight={plateFor}
        onClose={() => setPlateFor(null)}
      />

      <Sheet visible={finishOpen} onClose={() => setFinishOpen(false)} title="Terminare l’allenamento?" scrollable={false}>
        <Text variant="caption" tone="dim">
          {totals.totalSets} {totals.totalSets === 1 ? 'serie completata' : 'serie completate'} ·{' '}
          {formatVolume(totals.totalVolume, settings.unit)} di volume · {formatDuration(elapsed)}.
          {'\n'}Le serie lasciate in bianco verranno scartate.
        </Text>
        <Button
          title="Termina e salva"
          fullWidth
          onPress={() => {
            finishSession(sessionId);
            setFinishOpen(false);
            router.replace('/history');
          }}
        />
        <SheetAction
          label="Scarta l’allenamento"
          destructive
          onPress={() => {
            setFinishOpen(false);
            Alert.alert('Scartare tutto?', 'Niente di questa seduta finirà nello storico.', [
              { text: 'Annulla', style: 'cancel' },
              {
                text: 'Scarta',
                style: 'destructive',
                onPress: () => {
                  discardSession(sessionId);
                  router.back();
                },
              },
            ]);
          }}
        />
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text variant="label" tone="faint">
        {label}
      </Text>
      <Text variant="heading" numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statsRow: { flexDirection: 'row', gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  supersetLink: { flexDirection: 'row', alignItems: 'center', paddingLeft: 4 },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

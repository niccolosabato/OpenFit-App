import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, useScreenChrome } from '@/components/ui/screen';
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
  finishSession,
  getPreviousPerformance,
  moveSessionExercise,
  removeSessionExercise,
  sessionExercisesQuery,
  sessionSetsQuery,
  updateSessionSet,
} from '@/db/queries/sessions';
import type { SessionExercise, SessionSet } from '@/db/schema';
import { ExerciseRail } from '@/features/session/exercise-rail';
import { PlateSheet } from '@/features/session/plate-sheet';
import { abandonSession, completeSet, uncompleteSet, type SetValues } from '@/features/session/actions';
import { describeRecordHits } from '@/features/session/record-message';
import { SetRow, SetRowHeader } from '@/features/session/set-row';
import { RestTimerBar } from '@/features/timer/rest-timer-bar';
import { useRestCountdown } from '@/features/timer/use-countdown';
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
  const { running: restRunning } = useRestCountdown();

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
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Posizione verticale di ogni card, per poterci saltare dalla striscia.
  const offsets = useRef<number[]>([]);
  const scrollRef = useRef<ScrollView>(null);

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

  /**
   * Prestazione precedente per ogni esercizio.
   *
   * La chiave del memo è la lista degli esercizi e non `items`: quest'ultimo
   * cambia identità a ogni serie spuntata, e rileggere lo storico dal database
   * a ogni tocco durante l'allenamento sarebbe uno spreco.
   */
  const exerciseIds = items.map((i) => i.exercise.id).join(',');
  const previousByExercise = useMemo(() => {
    const map = new Map<string, SessionSet[]>();
    for (const id of exerciseIds ? exerciseIds.split(',') : []) {
      map.set(id, getPreviousPerformance(id, sessionId)?.sets ?? []);
    }
    return map;
  }, [exerciseIds, sessionId]);

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

  /** Serie fatte su serie previste, esercizio per esercizio: nutre la striscia. */
  const railItems = items.map((item) => {
    const sets = (setsByExercise.get(item.sessionExercise.id) ?? []).filter(
      (set) => set.parentSetId === null,
    );
    return {
      id: item.sessionExercise.id,
      name: item.exercise.name,
      done: sets.filter((set) => set.completedAt !== null).length,
      total: sets.length,
    };
  });

  const allDone =
    railItems.length > 0 && railItems.every((item) => item.total > 0 && item.done >= item.total);

  function jumpTo(index: number) {
    const y = offsets.current[index];
    if (y === undefined) return;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  }

  /** Il primo esercizio con ancora qualcosa da fare, altrimenti il successivo. */
  function jumpToNext() {
    const pending = railItems.findIndex((item, i) => i > activeIndex && item.done < item.total);
    const fallback = railItems.findIndex((item) => item.done < item.total);
    const target = pending >= 0 ? pending : fallback;
    if (target >= 0) jumpTo(target);
  }

  function addSetToActive() {
    const item = items[activeIndex];
    if (item) addSessionSet(item.sessionExercise.id);
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
              abandonSession(sessionId);
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
    <Screen
      padded={false}
      header={
        <SessionHeader
          name={session.name}
          elapsed={elapsed}
          volume={formatVolume(totals.totalVolume, settings.unit)}
          sets={String(totals.totalSets)}
          onMenu={() => setSessionMenuOpen(true)}
          rail={
            <ExerciseRail
              items={railItems}
              activeIndex={activeIndex}
              onJump={jumpTo}
              onAdd={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
            />
          }
        />
      }
      // Una barra sola in fondo, con due stati: mentre il recupero gira mostra
      // il countdown, altrimenti le azioni. "Termina" non sta più nell'angolo
      // alto-destro, e diventa l'azione principale quando non resta più nulla
      // da fare — sotto il pollice esattamente quando serve.
      actionBar={
        <ActionBar>
          {restRunning ? (
            <RestTimerBar />
          ) : (
            <>
              <IconButton
                icon="dots-horizontal"
                label="Opzioni dell'allenamento"
                surface
                onPress={() => setSessionMenuOpen(true)}
              />
              {items.length > 0 ? (
                <>
                  <Button
                    title="Serie"
                    variant="secondary"
                    icon={<MaterialCommunityIcons name="plus" size={18} color={theme.colors.text} />}
                    onPress={addSetToActive}
                  />
                  <View style={{ flex: 1 }}>
                    {allDone ? (
                      <Button title="Termina" size="lg" fullWidth onPress={confirmFinish} />
                    ) : (
                      <Button
                        title="Avanti"
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onPress={jumpToNext}
                      />
                    )}
                  </View>
                </>
              ) : (
                <View style={{ flex: 1 }}>
                  <Button
                    title="Aggiungi esercizio"
                    size="lg"
                    fullWidth
                    onPress={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
                  />
                </View>
              )}
            </>
          )}
        </ActionBar>
      }>
      <SessionScroll
        scrollRef={scrollRef}
        offsets={offsets}
        onActiveChange={setActiveIndex}>
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
              <View
                key={item.sessionExercise.id}
                style={{ gap: theme.space.sm }}
                onLayout={(e) => {
                  offsets.current[index] = e.nativeEvent.layout.y;
                }}>
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
                      <IconButton
                        icon="circle-slice-8"
                        label="Calcolatore dischi"
                        tone="dim"
                        onPress={() => {
                          const reference = topLevel.find((s) => s.weight)?.weight ?? settings.barWeight;
                          setPlateFor(reference);
                        }}
                      />
                    ) : null}

                    <IconButton
                      icon="dots-horizontal"
                      label="Opzioni esercizio"
                      tone="dim"
                      onPress={() => setMenuExercise(item.sessionExercise)}
                    />
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
                      { minHeight: 52, borderTopColor: theme.colors.border, gap: theme.space.sm },
                      pressed && { backgroundColor: theme.colors.surface3 },
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

      </SessionScroll>

      {/* ────────────────────────────────────── opzioni dell'allenamento ── */}
      <Sheet
        visible={sessionMenuOpen}
        onClose={() => setSessionMenuOpen(false)}
        title={session.name}
        scrollable={false}>
        <SheetAction
          label="Aggiungi esercizio"
          onPress={() => {
            setSessionMenuOpen(false);
            router.push({ pathname: '/exercise/picker', params: { sessionId } });
          }}
        />
        <SheetAction
          label="Riordina gli esercizi"
          description="Senza chiudere il foglio a ogni spostamento."
          onPress={() => {
            setSessionMenuOpen(false);
            setReorderOpen(true);
          }}
        />
        <SheetAction
          label="Riduci a icona"
          description="L'allenamento resta aperto, la barra in fondo lo riporta qui."
          onPress={() => {
            setSessionMenuOpen(false);
            router.back();
          }}
        />
        <SheetAction
          label="Termina e salva"
          onPress={() => {
            setSessionMenuOpen(false);
            confirmFinish();
          }}
        />
        <SheetAction
          label="Scarta l’allenamento"
          destructive
          onPress={() => {
            setSessionMenuOpen(false);
            Alert.alert('Scartare l’allenamento?', 'Le serie registrate vanno perse.', [
              { text: 'Annulla', style: 'cancel' },
              {
                text: 'Scarta',
                style: 'destructive',
                onPress: () => {
                  abandonSession(sessionId);
                  router.back();
                },
              },
            ]);
          }}
        />
      </Sheet>

      {/* ──────────────────────────────────────────────────────── riordino ── */}
      {/* Le frecce non chiudono il foglio: spostare un esercizio di quattro
          posti costava otto tocchi e quattro aperture di menu. */}
      <Sheet
        visible={reorderOpen}
        onClose={() => setReorderOpen(false)}
        title="Riordina gli esercizi">
        {items.map((item, index) => (
          <View key={item.sessionExercise.id} style={[styles.reorderRow, { gap: theme.space.sm }]}>
            <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
              {item.exercise.name}
            </Text>
            <IconButton
              icon="chevron-up"
              label={`Sposta ${item.exercise.name} in su`}
              surface
              disabled={index === 0}
              onPress={() => moveSessionExercise(sessionId, item.sessionExercise.id, -1)}
            />
            <IconButton
              icon="chevron-down"
              label={`Sposta ${item.exercise.name} in giù`}
              surface
              disabled={index === items.length - 1}
              onPress={() => moveSessionExercise(sessionId, item.sessionExercise.id, 1)}
            />
          </View>
        ))}
      </Sheet>

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
                  abandonSession(sessionId);
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

/**
 * Header della sessione: navigazione, statistiche e striscia degli esercizi
 * in un blocco solo, fermo sopra il contenuto che scorre.
 */
function SessionHeader({
  name,
  elapsed,
  volume,
  sets,
  onMenu,
  rail,
}: {
  name: string;
  elapsed: number;
  volume: string;
  sets: string;
  onMenu: () => void;
  rail: React.ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Surface
      level="high"
      radius={0}
      style={{
        paddingTop: insets.top + theme.space.sm,
        paddingBottom: theme.space.sm,
        gap: theme.space.sm,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
      }}>
      <View style={[styles.headerRow, { paddingHorizontal: theme.space.lg }]}>
        <IconButton icon="chevron-down" label="Riduci a icona" size={28} onPress={() => router.back()} />
        <Text variant="heading" style={{ flex: 1 }} numberOfLines={1}>
          {name}
        </Text>
        <IconButton icon="dots-horizontal" label="Opzioni dell'allenamento" surface onPress={onMenu} />
      </View>

      <View style={[styles.statsRow, { paddingHorizontal: theme.space.lg }]}>
        <Stat label="Durata" value={formatDuration(elapsed)} />
        <Stat label="Volume" value={volume} />
        <Stat label="Serie" value={sets} />
      </View>

      {rail}
    </Surface>
  );
}

/**
 * Lo scroll della sessione.
 *
 * Tiene il conto di dove comincia ogni esercizio — serve alla striscia per
 * saltarci — e di quale sia quello in vista, che è l'esercizio a cui la barra
 * in fondo aggiunge le serie.
 */
function SessionScroll({
  children,
  scrollRef,
  offsets,
  onActiveChange,
}: {
  children: React.ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
  offsets: React.RefObject<number[]>;
  onActiveChange: (index: number) => void;
}) {
  const theme = useTheme();
  const chrome = useScreenChrome();

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      scrollEventThrottle={100}
      onScroll={(e) => {
        const y = e.nativeEvent.contentOffset.y + chrome.top + 24;
        let index = 0;
        offsets.current.forEach((offset, i) => {
          if (offset !== undefined && offset <= y) index = i;
        });
        onActiveChange(index);
      }}
      contentContainerStyle={{
        paddingTop: chrome.top + theme.space.md,
        paddingBottom: chrome.bottom + theme.space.xl,
        paddingHorizontal: theme.space.lg,
        gap: theme.space.md,
      }}
      scrollIndicatorInsets={{ top: chrome.top, bottom: chrome.bottom }}>
      {children}
    </ScrollView>
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
  reorderRow: { flexDirection: 'row', alignItems: 'center' },
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

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar, ActionBarPrimary } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { Surface } from '@/components/ui/surface';
import { IconButton } from '@/components/ui/icon-button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Screen, useScreenChrome } from '@/components/ui/screen';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { StatRow } from '@/components/ui/stat';
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
import { useLiveRows } from '@/db/live';
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

/** Dove comincia una card e quanto è alta, in coordinate dello scorrimento. */
type CardBox = { y: number; height: number };

/** Quel che la schermata può chiedere allo scorrimento. */
type SessionScrollHandle = { jumpTo: (index: number) => void };

export default function ActiveSessionScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const showToast = useToast((s) => s.show);
  const startRest = useRestTimer((s) => s.start);
  const { running: restRunning } = useRestCountdown();

  // `useLiveRows` e non `useLiveQuery`: qui la prima lettura deve essere già
  // arrivata al primo render. La sessione entra dal basso con un'animazione da
  // trecento millisecondi, e con una lettura che arriva dopo si legge
  // «Allenamento vuoto» per tutta l'entrata, prima che compaia la seduta vera.
  const sessionRows = useLiveRows(activeSessionQuery());
  const session = sessionRows[0];
  const sessionId = session?.id ?? '';

  const items = useLiveRows(
    useMemo(() => sessionExercisesQuery(sessionId), [sessionId]),
    [sessionId],
  );
  const setRows = useLiveRows(
    useMemo(() => sessionSetsQuery(sessionId), [sessionId]),
    [sessionId],
  );

  const allSets = useMemo(() => setRows.map((r) => r.set), [setRows]);

  // Un superset è contiguità: gruppi di indici consecutivi con lo stesso
  // `supersetGroup`. Non allenanti (`null`) restano gruppi di uno.
  const supersetGroups: number[][] = [];
  items.forEach((item, index) => {
    const previousItem = items[index - 1];
    const sameAsPrevious =
      item.sessionExercise.supersetGroup !== null &&
      item.sessionExercise.supersetGroup === previousItem?.sessionExercise.supersetGroup;
    if (sameAsPrevious && supersetGroups.length > 0) {
      supersetGroups[supersetGroups.length - 1].push(index);
    } else {
      supersetGroups.push([index]);
    }
  });

  /**
   * Per ogni esercizio che sta in un superset: in che posizione del giro e su
   * quanti. Basta questo a raccontarlo — «Superset · 2 di 3» sulla card e uno
   * spazio più stretto fra i membri — senza raccoglierli in un contenitore.
   *
   * Il contenitore c'era, ed è ciò che sfasava la striscia in alto: le card
   * dentro un superset misuravano la propria posizione **rispetto al
   * contenitore**, non allo scorrimento, e la striscia le cercava a un'altezza
   * che non era la loro. È anche lo stesso modo in cui il costruttore delle
   * schede mostra i superset, che finora andava per conto suo.
   */
  const supersetOf = new Map<number, { position: number; size: number }>();
  for (const members of supersetGroups) {
    if (members.length < 2) continue;
    members.forEach((memberIndex, position) => {
      supersetOf.set(memberIndex, { position: position + 1, size: members.length });
    });
  }

  const [elapsed, setElapsed] = useState(0);
  const [menuSet, setMenuSet] = useState<SessionSet | null>(null);
  const [menuExercise, setMenuExercise] = useState<SessionExercise | null>(null);
  const [plateFor, setPlateFor] = useState<number | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Posizione e altezza di ogni card: le scrivono le card, le legge lo
  // scorrimento per sapere dove saltare e cosa si sta guardando.
  const cards = useRef<(CardBox | undefined)[]>([]);
  const scroll = useRef<SessionScrollHandle>(null);

  // Lo schermo resta acceso per tutta la seduta: fra una serie e l'altra il
  // telefono è appoggiato sulla panca e riaccenderlo ogni volta è un attrito.
  useEffect(() => {
    if (!session || !settings.keepAwake) return;
    activateKeepAwakeAsync('openfit-session').catch(() => {});
    return () => {
      deactivateKeepAwake('openfit-session');
    };
  }, [session, settings.keepAwake]);

  // Le misure sono indicizzate per posizione: togliendo un esercizio, quelle
  // in coda resterebbero appese a indici che non esistono più, e lo
  // scorrimento andrebbe a cercare una card sparita. Gli effetti girano prima
  // che il layout riscriva le misure rimaste, quindi il taglio è al sicuro.
  useEffect(() => {
    cards.current.length = items.length;
  }, [items.length]);

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

  /** Card di un esercizio in sessione. */
  function renderExerciseCard(item: (typeof items)[number], index: number) {
    const sets = setsByExercise.get(item.sessionExercise.id) ?? [];
    const topLevel = sets.filter((s) => s.parentSetId === null);
    const doneCount = topLevel.filter((s) => s.completedAt !== null).length;
    const previousSets = previousByExercise.get(item.exercise.id) ?? [];
    const superset = supersetOf.get(index);

    let workingIndex = 0;
    let previousIndex = 0;

    return (
      <View
        key={item.sessionExercise.id}
        // Figlio diretto dello scorrimento: solo così `layout` è la posizione
        // vera della card. L'altezza serve quanto la posizione — è con quella
        // che si capisce quale esercizio sta occupando lo schermo.
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          cards.current[index] = { y, height };
        }}
        style={{
          // I membri di uno stesso giro si stringono; fra esercizi diversi
          // resta il respiro normale della lista.
          marginTop:
            index === 0 ? 0 : superset && superset.position > 1 ? theme.space.xs : theme.space.md,
        }}>
        <Card padded={false}>
          <View style={[styles.cardHead, { padding: theme.space.md, gap: theme.space.sm }]}>
            {/* L'anello dice a che punto è questo esercizio senza far contare
                le spunte una per una: durante una seduta è l'unica domanda
                che ci si fa guardando una card. */}
            <ProgressRing
              value={topLevel.length > 0 ? doneCount / topLevel.length : 0}
              size={40}
              stroke={4}
              trackColor={theme.colors.surface3}>
              <Text variant="label" tone={doneCount === topLevel.length && topLevel.length > 0 ? 'accent' : 'faint'} numeric>
                {doneCount}/{topLevel.length}
              </Text>
            </ProgressRing>

            <Pressable
              onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.exercise.id } })}
              // Alto quanto i tasti che gli stanno accanto: sotto i
              // 48dp non si azzecca con le mani sudate, e il nome
              // restava appeso in cima alla testata.
              style={{ flex: 1, gap: theme.space.xs, minHeight: theme.hit, justifyContent: 'center' }}>
              {superset ? (
                <Text variant="label" tone="accent">
                  Superset · {superset.position} di {superset.size}
                </Text>
              ) : null}
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
            accessibilityRole="button"
            accessibilityLabel={`Aggiungi una serie a ${item.exercise.name}`}
            style={({ pressed }) => [
              styles.addSet,
              { minHeight: theme.hit, borderTopColor: theme.colors.border, gap: theme.space.sm },
              pressed && { backgroundColor: theme.colors.surface2 },
            ]}>
            <MaterialCommunityIcons name="plus" size={16} color={theme.colors.accent} />
            <Text variant="caption" weight="semibold" tone="accent">
              Aggiungi serie
            </Text>
          </Pressable>
        </Card>
      </View>
    );
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

  // Avanzamento dell'intera seduta: serie spuntate su serie in programma.
  const plannedSets = railItems.reduce((sum, item) => sum + item.total, 0);
  const completedSets = railItems.reduce((sum, item) => sum + item.done, 0);
  const progress = plannedSets > 0 ? completedSets / plannedSets : 0;

  /**
   * Salta all'esercizio scelto nella striscia.
   *
   * La pastiglia si accende subito, prima che l'animazione arrivi: se
   * aspettasse lo scorrimento, il tocco resterebbe senza risposta per il
   * tempo di un'animazione intera.
   */
  function jumpTo(index: number) {
    setActiveIndex(index);
    scroll.current?.jumpTo(index);
  }

  function confirmFinish() {
    if (totals.totalSets === 0) {
      confirm({
        title: 'Nessuna serie completata',
        message: 'Non c’è niente da salvare. Vuoi scartare questo allenamento?',
        cancelLabel: 'Continua',
        action: {
          label: 'Scarta',
          destructive: true,
          onPress: () => {
            abandonSession(sessionId);
            router.back();
          },
        },
      });
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
          progress={progress}
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
      /**
       * La barra in fondo tiene **una** cosa sola.
       *
       * Ne teneva tre, e due erano già altrove: le opzioni le apre il tasto
       * in alto a destra, e "aggiungi serie" sta in fondo a ogni card, dove
       * la serie va aggiunta. La terza, "Avanti", faceva quello che fanno già
       * la striscia in alto e il dito — scorrere — e occupava il posto più
       * comodo dello schermo per farlo.
       *
       * Resta l'unica azione che qui non è ripetuta: concludere. Sotto il
       * pollice sempre, spenta finché c'è ancora qualcosa da fare e accesa
       * appena non c'è più. Mentre il recupero gira la barra è tutta del
       * countdown.
       */
      actionBar={
        <ActionBar>
          {restRunning ? (
            <RestTimerBar />
          ) : items.length === 0 ? (
            <ActionBarPrimary>
              <Button
                title="Aggiungi esercizio"
                size="lg"
                fullWidth
                onPress={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
              />
            </ActionBarPrimary>
          ) : (
            <ActionBarPrimary>
              <Button
                title="Termina l’allenamento"
                variant={allDone ? 'primary' : 'secondary'}
                size="lg"
                fullWidth
                onPress={confirmFinish}
              />
            </ActionBarPrimary>
          )}
        </ActionBar>
      }>
      <SessionScroll ref={scroll} cards={cards} onActiveChange={setActiveIndex}>
        {items.length === 0 ? (
          <EmptyState
            icon="plus-circle-outline"
            title="Allenamento vuoto"
            description="Aggiungi il primo esercizio per cominciare a registrare."
            actionLabel="Aggiungi esercizio"
            onAction={() => router.push({ pathname: '/exercise/picker', params: { sessionId } })}
          />
        ) : (
          items.map((item, index) => renderExerciseCard(item, index))
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
            confirm({
              title: 'Scartare l’allenamento?',
              message: 'Le serie registrate vanno perse.',
              action: {
                label: 'Scarta',
                destructive: true,
                onPress: () => {
                  abandonSession(sessionId);
                  router.back();
                },
              },
            });
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
            confirm({
              title: 'Scartare tutto?',
              message: 'Niente di questa seduta finirà nello storico.',
              action: {
                label: 'Scarta',
                destructive: true,
                onPress: () => {
                  abandonSession(sessionId);
                  router.back();
                },
              },
            });
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
  progress,
  onMenu,
  rail,
}: {
  name: string;
  elapsed: number;
  volume: string;
  sets: string;
  /** Da 0 a 1: serie spuntate su serie in programma. */
  progress: number;
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

      <View style={{ paddingHorizontal: theme.space.lg, gap: theme.space.md }}>
        <StatRow
          fill
          gap={theme.space.md}
          items={[
            { label: 'Durata', value: formatDuration(elapsed) },
            { label: 'Volume', value: volume },
            { label: 'Serie', value: sets },
          ]}
        />
        {/* La barra dell'intera seduta: dice quanto manca alla fine, che è
            la domanda a cui la striscia sotto risponde solo esercizio per
            esercizio. */}
        <ProgressBar value={progress} height={4} trackColor={theme.colors.surface4} />
      </View>

      {rail}
    </Surface>
  );
}

/**
 * Lo scroll della sessione.
 *
 * Sa dove comincia e dove finisce ogni card, e da lì ricava le due cose che
 * servono alla striscia: dove saltare quando si tocca una pastiglia e quale
 * esercizio si sta guardando. Le tiene entrambe qui perché sono la stessa
 * geometria, e perché l'altezza dell'header — che galleggia sopra lo
 * scorrimento e ne copre la cima — si legge solo da dentro `Screen`.
 */
function SessionScroll({
  children,
  ref,
  cards,
  onActiveChange,
}: {
  children: React.ReactNode;
  ref?: React.Ref<SessionScrollHandle>;
  /** Dove comincia e quanto è alta ogni card, riempita da chi le disegna. */
  cards: React.RefObject<(CardBox | undefined)[]>;
  onActiveChange: (index: number) => void;
}) {
  const theme = useTheme();
  const chrome = useScreenChrome();
  const scrollRef = useRef<ScrollView>(null);

  /** L'esercizio verso cui si sta scorrendo, finché non ci si arriva. */
  const jumpTarget = useRef<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      jumpTo(index: number) {
        const box = cards.current[index];
        if (!box) return;

        jumpTarget.current = index;
        // La card deve fermarsi **sotto** l'header, che galleggia sopra lo
        // scorrimento e ne copre i primi `chrome.top` punti. Senza toglierli
        // si scorreva di un'intestazione intera più del dovuto: l'esercizio
        // scelto finiva nascosto lassù e a schermo compariva il successivo.
        scrollRef.current?.scrollTo({
          y: Math.max(0, box.y - chrome.top - theme.space.sm),
          animated: true,
        });
      },
    }),
    [cards, chrome.top, theme.space.sm],
  );

  /** Lo scorrimento si è fermato, o l'ha ripreso in mano il dito. */
  function settle() {
    jumpTarget.current = null;
  }

  return (
    <ScrollView
      ref={scrollRef}
      keyboardShouldPersistTaps="handled"
      // A cento millisecondi la striscia arrivava a scatti e sempre un
      // esercizio indietro rispetto a quello che si stava guardando. A ogni
      // fotogramma il conto è una manciata di confronti su una lista di dieci.
      scrollEventThrottle={16}
      onMomentumScrollEnd={settle}
      onScrollBeginDrag={settle}
      onScroll={(e) => {
        const { contentOffset, layoutMeasurement } = e.nativeEvent;

        // La finestra davvero visibile: quella dello scorrimento meno il
        // chrome che ci galleggia sopra e sotto.
        const top = contentOffset.y + chrome.top;
        const bottom = contentOffset.y + layoutMeasurement.height - chrome.bottom;

        /*
         * L'esercizio in vista è quello che **occupa più finestra**, non
         * quello il cui bordo superiore ha appena superato una soglia.
         *
         * Con card alte quanto le serie che contengono, il bordo di un
         * esercizio passa la soglia molto prima che quell'esercizio sia
         * davvero ciò che si sta guardando: la striscia restava indietro di
         * uno per tutta l'altezza della card precedente.
         */
        let best = 0;
        let bestVisible = -1;

        cards.current.forEach((box, index) => {
          if (!box) return;
          const visible = Math.min(box.y + box.height, bottom) - Math.max(box.y, top);
          if (visible > bestVisible) {
            bestVisible = visible;
            best = index;
          }
        });

        // Durante un salto gli indici che passano sono quelli attraversati
        // dall'animazione: la pausa si chiude appena arriva quello scelto.
        if (jumpTarget.current !== null) {
          if (best === jumpTarget.current) jumpTarget.current = null;
          return;
        }

        onActiveChange(best);
      }}
      contentContainerStyle={{
        paddingTop: chrome.top + theme.space.md,
        paddingBottom: chrome.bottom + theme.space.xl,
        paddingHorizontal: theme.space.lg,
      }}
      scrollIndicatorInsets={{ top: chrome.top, bottom: chrome.bottom }}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  reorderRow: { flexDirection: 'row', alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

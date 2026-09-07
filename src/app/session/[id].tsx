import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tag } from '@/components/ui/chip';
import { confirm } from '@/components/ui/confirm';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Stat } from '@/components/ui/stat';
import { Text } from '@/components/ui/text';
import { SET_TYPE_BADGE, countsAsWorkingSet, usesDuration, usesWeight } from '@/db/enums';
import {
  sessionExercisesQuery,
  sessionQuery,
  sessionSetsQuery,
  startSessionFromDay,
} from '@/db/queries/sessions';
import { useLiveRows } from '@/db/live';
import type { SessionSet } from '@/db/schema';
import { removeSession } from '@/features/session/actions';
import { startWorkout } from '@/features/session/start';
import { formatDuration, formatDurationLong, formatSessionDate, formatTime } from '@/lib/format';
import { formatNumber, formatVolume, fromKg } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function SessionDetailScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [menuOpen, setMenuOpen] = useState(false);

  // Letture già pronte al primo render: con quelle vive si leggeva
  // «Allenamento non trovato» per tutta l'animazione di entrata, e solo dopo
  // compariva la seduta.
  const sessionRows = useLiveRows(useMemo(() => sessionQuery(id), [id]), [id]);
  const items = useLiveRows(useMemo(() => sessionExercisesQuery(id), [id]), [id]);
  const setRows = useLiveRows(useMemo(() => sessionSetsQuery(id), [id]), [id]);

  const session = sessionRows[0];

  const setsByExercise = useMemo(() => {
    const map = new Map<string, SessionSet[]>();
    for (const row of setRows) {
      const list = map.get(row.set.sessionExerciseId) ?? [];
      list.push(row.set);
      map.set(row.set.sessionExerciseId, list);
    }
    return map;
  }, [setRows]);

  if (!session) {
    return (
      <Screen padded={false} header={<ScreenHeader title="Allenamento" showBack />}>
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Allenamento non trovato.
        </Text>
      </Screen>
    );
  }

  function confirmDelete() {
    confirm({
      title: 'Eliminare l’allenamento?',
      message:
        'Sparisce dallo storico e dalle statistiche. I record che dipendono da questa seduta vengono ricalcolati.',
      action: {
        label: 'Elimina',
        destructive: true,
        onPress: () => {
          removeSession(id);
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
          title={session.name}
          subtitle={`${formatSessionDate(session.startedAt)} alle ${formatTime(session.startedAt)}`}
          showBack
          actions={[{ icon: 'dots-horizontal', label: 'Opzioni', onPress: () => setMenuOpen(true) }]}
        />
      }
      actionBar={
        session.routineDayId ? (
          <ActionBar>
            <View style={{ flex: 1 }}>
              <Button
                title="Ripeti questo allenamento"
                size="lg"
                fullWidth
                onPress={() => startWorkout(() => startSessionFromDay(session.routineDayId!))}
              />
            </View>
          </ActionBar>
        ) : undefined
      }>
      <ScreenScroll gap={theme.space.md}>
        <Card wash>
          <View style={[styles.stats, { rowGap: theme.space.lg }]}>
            <Stat
              size="sm"
              label="Durata"
              value={formatDurationLong(session.durationSeconds ?? 0)}
              style={styles.metric}
            />
            <Stat
              size="sm"
              label="Volume"
              value={formatVolume(session.totalVolume, settings.unit)}
              style={styles.metric}
            />
            <Stat size="sm" label="Serie" value={String(session.totalSets)} style={styles.metric} />
            <Stat
              size="sm"
              label="Ripetizioni"
              value={String(session.totalReps)}
              style={styles.metric}
            />
          </View>
          {session.notes ? (
            <Text variant="caption" tone="dim" style={{ marginTop: theme.space.lg }}>
              {session.notes}
            </Text>
          ) : null}
        </Card>

        <Section title="Come è andata" style={{ paddingHorizontal: theme.space.xs }} />

        {items.map((item) => {
          const sets = setsByExercise.get(item.sessionExercise.id) ?? [];
          const topLevel = sets.filter((s) => s.parentSetId === null);
          let workingIndex = 0;

          return (
            <Card key={item.sessionExercise.id} padded={false}>
              <View style={{ padding: theme.space.lg, paddingBottom: theme.space.sm }}>
                <Text variant="heading" numberOfLines={2}>
                  {item.exercise.name}
                </Text>
              </View>

              {topLevel.map((set) => {
                if (countsAsWorkingSet(set.setType)) workingIndex += 1;
                const children = sets.filter((s) => s.parentSetId === set.id);

                return (
                  <View key={set.id}>
                    <SetLine
                      set={set}
                      index={workingIndex}
                      tracking={item.exercise.trackingType}
                      unit={settings.unit}
                    />
                    {children.map((child) => (
                      <SetLine
                        key={child.id}
                        set={child}
                        index={0}
                        tracking={item.exercise.trackingType}
                        unit={settings.unit}
                        isChild
                      />
                    ))}
                  </View>
                );
              })}
            </Card>
          );
        })}

      </ScreenScroll>

      {/* L'eliminazione era un cestino nell'angolo alto-destro: un tocco solo,
          nel punto più facile da sfiorare reggendo il telefono. */}
      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={session.name} scrollable={false}>
        <SheetAction
          label="Elimina l’allenamento"
          description="Sparisce dallo storico e dalle statistiche."
          destructive
          onPress={() => {
            setMenuOpen(false);
            confirmDelete();
          }}
        />
      </Sheet>
    </Screen>
  );
}

function SetLine({
  set,
  index,
  tracking,
  unit,
  isChild,
}: {
  set: SessionSet;
  index: number;
  tracking: Parameters<typeof usesWeight>[0];
  unit: 'kg' | 'lb';
  isChild?: boolean;
}) {
  const theme = useTheme();
  const badge = SET_TYPE_BADGE[set.setType];

  const parts: string[] = [];
  if (usesDuration(tracking) && set.durationSeconds) parts.push(formatDuration(set.durationSeconds));
  if (usesWeight(tracking) && set.weight !== null) parts.push(`${formatNumber(fromKg(set.weight, unit))} ${unit}`);
  if (set.reps !== null) parts.push(`× ${set.reps}`);
  if (set.rpe !== null) parts.push(`@${set.rpe}`);
  if (set.rir !== null) parts.push(`${set.rir} RIR`);

  return (
    <View
      style={[
        styles.setLine,
        {
          minHeight: 42,
          paddingHorizontal: theme.space.lg,
          paddingLeft: isChild ? theme.space.lg + 16 : theme.space.lg,
          gap: theme.space.md,
          borderTopColor: theme.colors.border,
        },
      ]}>
      <View style={{ width: 30, alignItems: 'center' }}>
        {set.setType === 'working' && !isChild ? (
          <Text variant="caption" tone="dim" numeric>
            {index}
          </Text>
        ) : (
          <Tag label={badge} />
        )}
      </View>

      <Text variant="subtitle" numeric style={{ flex: 1 }}>
        {parts.join(' ') || '—'}
      </Text>

      {set.isPr ? <MaterialCommunityIcons name="trophy" size={15} color={theme.colors.record} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap' },
  // Due colonne esatte: con `flexGrow` l'ultima riga si allargava e i quattro
  // numeri non stavano più incolonnati.
  metric: { width: '50%' },
  setLine: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
});

/**
 * Record e progressione di un singolo esercizio, nella schermata di dettaglio.
 *
 * È il pezzo che risponde alla domanda che ci si fa davanti al bilanciere:
 * *quanto ho fatto l'ultima volta, e qual è il mio massimo?*
 */

import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { LineChart } from '@/components/charts/line-chart';
import { Card } from '@/components/ui/card';
import { Divider } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import type { Exercise } from '@/db/schema';
import { progressionBySession } from '@/features/stats/aggregate';
import { exerciseRecordsQuery } from '@/features/stats/records';
import { exerciseStatSetsQuery, toStatSets } from '@/features/stats/queries';
import { formatSessionDate } from '@/lib/format';
import { formatWeight } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export function ExerciseSummary({ exercise }: { exercise: Exercise }) {
  const theme = useTheme();
  const { settings } = useSettings();

  const { data: statRows } = useLiveQuery(
    useMemo(() => exerciseStatSetsQuery(exercise.id), [exercise.id]),
    [exercise.id],
  );
  const { data: recordRows } = useLiveQuery(
    useMemo(() => exerciseRecordsQuery(exercise.id), [exercise.id]),
    [exercise.id],
  );

  const sets = useMemo(() => toStatSets(statRows), [statRows]);
  const progression = useMemo(() => progressionBySession(sets), [sets]);
  const records = recordRows ?? [];

  if (progression.length === 0) {
    return (
      <Card>
        <Text variant="label" tone="dim">
          Storico e record
        </Text>
        <Text variant="caption" tone="faint" style={{ marginTop: theme.space.sm }}>
          Compariranno qui appena avrai registrato la prima sessione con questo esercizio.
        </Text>
      </Card>
    );
  }

  const bestWeight = records.find((r) => r.type === 'best_weight');
  const bestE1rm = records.find((r) => r.type === 'best_e1rm');
  const repMaxes = records
    .filter((r) => r.type === 'rep_max')
    .sort((a, b) => a.reps - b.reps)
    .slice(0, 8);

  // La progressione si legge sul massimale stimato: rende confrontabili sedute
  // fatte a carichi e ripetizioni diversi, cosa che il solo carico non fa.
  const e1rmPoints = progression
    .filter((p) => p.bestE1rm !== null)
    .map((p) => ({ x: p.startedAt, y: p.bestE1rm! }));

  const recent = [...progression].reverse().slice(0, 8);

  return (
    <View style={{ gap: theme.space.md }}>
      <Card wash>
        <View style={{ gap: theme.space.lg }}>
          <Text variant="heading">Record</Text>

          <View style={[styles.row, { gap: theme.space.xl }]}>
            <Metric
              label="Carico massimo"
              value={bestWeight ? formatWeight(bestWeight.value, settings.unit) : '—'}
              detail={
                bestWeight?.achievedReps ? `× ${bestWeight.achievedReps} ripetizioni` : undefined
              }
            />
            <Metric
              label="Massimale stimato"
              value={bestE1rm ? formatWeight(bestE1rm.value, settings.unit) : '—'}
              detail={bestE1rm ? formatSessionDate(bestE1rm.achievedAt) : undefined}
            />
          </View>

          {repMaxes.length > 0 ? (
            <View style={{ gap: theme.space.sm }}>
              <Text variant="label" tone="dim">
                Per ripetizioni
              </Text>
              <View style={[styles.repGrid, { gap: theme.space.sm }]}>
                {repMaxes.map((record) => (
                  <Surface
                    key={record.id}
                    level="mid"
                    radius={theme.radius.md}
                    bordered={false}
                    style={[
                      styles.repChip,
                      { paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm, gap: 2 },
                    ]}>
                    <Text variant="label" tone="faint">
                      {record.reps} rip
                    </Text>
                    <Text variant="subtitle" numeric>
                      {formatWeight(record.value, settings.unit)}
                    </Text>
                  </Surface>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Card>

      <Card>
        <View style={{ gap: theme.space.lg }}>
          <View style={{ gap: theme.space.xs }}>
            <Text variant="heading">Progressione</Text>
            <Text variant="caption" tone="dim">
              Massimale stimato migliore per seduta.
            </Text>
          </View>
          <LineChart
            data={e1rmPoints}
            formatValue={(v) => formatWeight(v, settings.unit)}
            formatX={(x) => formatSessionDate(new Date(x))}
            emptyLabel="Servono almeno due sedute con carico e ripetizioni."
          />
        </View>
      </Card>

      <Card padded={false}>
        <View style={{ padding: theme.space.lg, paddingBottom: theme.space.sm }}>
          <Text variant="heading">Sedute recenti</Text>
        </View>
        {recent.map((session, index) => (
          <View key={session.sessionId}>
            {index > 0 ? <Divider inset={theme.space.lg} /> : null}
            <View
              style={[
                styles.sessionRow,
                { paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, gap: theme.space.md },
              ]}>
              <Text variant="body" tone="dim" style={{ flex: 1 }}>
                {formatSessionDate(new Date(session.startedAt))}
              </Text>
              <Text variant="caption" tone="faint" numeric>
                {session.sets} serie
              </Text>
              <Text variant="subtitle" numeric style={styles.topWeight}>
                {session.topWeight !== null ? formatWeight(session.topWeight, settings.unit) : '—'}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, gap: theme.space.xs }}>
      <Stat label={label} value={value} />
      {detail ? (
        <Text variant="caption" tone="faint" numberOfLines={1}>
          {detail}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  repGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  repChip: { minWidth: 84 },
  sessionRow: { flexDirection: 'row', alignItems: 'center' },
  topWeight: { minWidth: 72, textAlign: 'right' },
});

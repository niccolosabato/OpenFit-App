import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BarChart, type BarDatum } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ProgressRing } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Segmented } from '@/components/ui/segmented';
import { Stat } from '@/components/ui/stat';
import { Text } from '@/components/ui/text';
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '@/db/enums';
import { bucketByWeek, setCountsByGroup, weeklyStreak } from '@/features/stats/aggregate';
import { statSetsQuery, toStatSets } from '@/features/stats/queries';
import { pluralize } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

const PERIODS = [
  { value: 4, label: '4 settimane' },
  { value: 12, label: '3 mesi' },
  { value: 26, label: '6 mesi' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Sotto questa soglia settimanale un gruppo è verosimilmente sottoallenato. */
const WEEKLY_SET_TARGET = 10;

export default function StatsScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const [weeks, setWeeks] = useState<number>(12);

  const since = useMemo(() => new Date(Date.now() - weeks * WEEK_MS), [weeks]);
  const { data } = useLiveQuery(useMemo(() => statSetsQuery(since), [since]), [since]);
  const sets = useMemo(() => toStatSets(data), [data]);

  const buckets = useMemo(
    () => bucketByWeek(sets, { weeks, now: Date.now(), firstDayOfWeek: settings.firstDayOfWeek }),
    [sets, weeks, settings.firstDayOfWeek],
  );

  const currentWeek = buckets[buckets.length - 1];

  // Le serie per gruppo si guardano sulla settimana in corso: è la finestra su
  // cui si ragiona quando si aggiusta il volume in corsa.
  const lastWeekStart = buckets.length >= 1 ? buckets[buckets.length - 1].weekStart : 0;
  const weekSets = useMemo(
    () => sets.filter((s) => s.startedAt >= lastWeekStart),
    [sets, lastWeekStart],
  );

  const groupCounts = useMemo(() => setCountsByGroup(weekSets), [weekSets]);

  const groupData: BarDatum[] = MUSCLE_GROUPS.filter((g) => g !== 'other').map((group) => ({
    label: MUSCLE_GROUP_LABELS[group],
    value: groupCounts[group],
    display: formatSetCount(groupCounts[group]),
    // La barra resta grigia per far notare il gruppo scoperto senza gridare.
    muted: groupCounts[group] < WEEKLY_SET_TARGET,
  }));

  const volumePoints = buckets.map((b) => ({ x: b.weekStart, y: b.volume }));
  const sessionPoints = buckets.map((b) => ({ x: b.weekStart, y: b.sessionIds.size }));

  const totalSessions = new Set(sets.map((s) => s.sessionId)).size;
  const totalVolume = buckets.reduce((sum, b) => sum + b.volume, 0);
  const streak = weeklyStreak(buckets);
  const goal = Math.max(1, settings.weeklySessionGoal);
  const done = currentWeek?.sessionIds.size ?? 0;

  const period = (
    <View style={{ paddingHorizontal: theme.space.sm }}>
      <Segmented options={PERIODS} value={weeks} onChange={setWeeks} />
    </View>
  );

  if (sets.length === 0) {
    return (
      <Screen
        padded={false}
        header={
          <ScreenHeader
            title="Statistiche"
            actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
          />
        }>
        <EmptyState
          icon="chart-line-variant"
          title="Niente da mostrare"
          description="Concludi qualche allenamento e qui compariranno serie per gruppo muscolare, volume e frequenza."
        />
      </Screen>
    );
  }

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title="Statistiche"
          actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
          // Il periodo era in cima allo scroll e spariva appena si guardava un
          // grafico: per cambiarlo bisognava risalire quattro schermate.
          below={period}
        />
      }>
      <ScreenScroll gap={theme.space.md} showsVerticalScrollIndicator={false}>
        {/* ──────────────────────────────────────────── il colpo d'occhio ── */}
        <Animated.View entering={FadeInDown.duration(theme.motion.duration.slow)}>
          <Card wash>
            <View style={[styles.hero, { gap: theme.space.lg }]}>
              <ProgressRing value={done / goal} size={84} stroke={8}>
                <Text variant="display" numeric style={styles.ringValue}>
                  {done}
                </Text>
                <Text variant="label" tone="faint">
                  su {goal}
                </Text>
              </ProgressRing>

              <View style={{ flex: 1, gap: theme.space.md }}>
                <View style={{ gap: theme.space.xs }}>
                  <Text variant="label" tone="dim">
                    Questa settimana
                  </Text>
                  <Text variant="caption" tone="faint">
                    {streak > 0
                      ? `${pluralize(streak, 'settimana', 'settimane')} di fila`
                      : 'Nessuna serie di settimane in corso'}
                  </Text>
                </View>

                <View style={[styles.heroStats, { gap: theme.space.lg }]}>
                  <Stat size="sm" label="Sedute" value={String(totalSessions)} />
                  <Stat
                    size="sm"
                    label="Volume"
                    value={formatVolume(totalVolume, settings.unit)}
                  />
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ─────────────────────────────────────────── serie per gruppo ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(theme.motion.duration.slow)}>
          <Card>
            <View style={{ gap: theme.space.lg }}>
              <View style={{ gap: theme.space.xs }}>
                <Text variant="heading">Serie per gruppo</Text>
                <Text variant="caption" tone="dim">
                  Settimana in corso. I muscoli secondari contano mezza serie;
                  sotto {WEEKLY_SET_TARGET} la barra resta grigia.
                </Text>
              </View>
              <BarChart data={groupData} emptyLabel="Nessuna serie questa settimana." />
            </View>
          </Card>
        </Animated.View>

        {/* ─────────────────────────────────────────── volume settimanale ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(theme.motion.duration.slow)}>
          <Card>
            <View style={{ gap: theme.space.lg }}>
              <View style={{ gap: theme.space.xs }}>
                <Text variant="heading">Volume settimanale</Text>
                <Text variant="caption" tone="dim">
                  Carico esterno per ripetizioni, sommato per settimana.
                </Text>
              </View>
              <LineChart
                data={volumePoints}
                formatValue={(v) => formatVolume(v, settings.unit)}
                formatX={formatWeekLabel}
                emptyLabel="Servono almeno due settimane di allenamenti."
              />
            </View>
          </Card>
        </Animated.View>

        {/* ────────────────────────────────────────────────── frequenza ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(theme.motion.duration.slow)}>
          <Card>
            <View style={{ gap: theme.space.lg }}>
              <View style={{ gap: theme.space.xs }}>
                <Text variant="heading">Frequenza</Text>
                <Text variant="caption" tone="dim">
                  Allenamenti conclusi per settimana.
                </Text>
              </View>
              <LineChart
                data={sessionPoints}
                formatValue={(v) => pluralize(v, 'allenamento', 'allenamenti')}
                formatX={formatWeekLabel}
                emptyLabel="Servono almeno due settimane di allenamenti."
              />
            </View>
          </Card>
        </Animated.View>
      </ScreenScroll>
    </Screen>
  );
}

/** `12,5` invece di `12.5`, e senza decimale quando è intero. */
function formatSetCount(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',');
}

function formatWeekLabel(weekStart: number): string {
  return format(new Date(weekStart), 'd MMM', { locale: it });
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center' },
  heroStats: { flexDirection: 'row' },
  // Il numero dentro l'anello: il corpo `display` con l'interlinea di serie
  // spingerebbe la coppia numero/etichetta fuori dal buco.
  ringValue: { fontSize: 30, lineHeight: 34 },
});

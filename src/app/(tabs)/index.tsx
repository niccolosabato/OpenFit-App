import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { format, startOfWeek } from 'date-fns';
import { it } from 'date-fns/locale';
import { count } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { routineDaysWithCountQuery, routineListQuery } from '@/db/queries/routines';
import { sessionHistoryQuery, startEmptySession, startSessionFromDay } from '@/db/queries/sessions';
import { exercises } from '@/db/schema';
import { startWorkout } from '@/features/session/start';
import { formatDurationLong, formatSessionDate, pluralize } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { capsule, useTheme } from '@/theme';

/** Saluto per fascia oraria: si allena a ogni ora, ma non si apre l'app a caso. */
function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

export default function TodayScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const now = new Date();

  const { data: exerciseCount } = useLiveQuery(db.select({ value: count() }).from(exercises));
  const { data: routineRows } = useLiveQuery(routineListQuery());
  const { data: sessionRows } = useLiveQuery(sessionHistoryQuery());

  // Il giorno da proporre viene dalla prima scheda: è quella che si sta
  // seguendo nella stragrande maggioranza dei casi.
  const firstRoutine = routineRows?.[0];
  const { data: dayRows } = useLiveQuery(
    useMemo(() => routineDaysWithCountQuery(firstRoutine?.id ?? ''), [firstRoutine?.id]),
    [firstRoutine?.id],
  );

  const days = dayRows ?? [];
  const sessions = sessionRows ?? [];
  const lastSession = sessions[0];

  /**
   * Il giorno proposto è **quello dopo l'ultimo fatto**, non sempre il primo.
   *
   * Chi segue una scheda a rotazione arrivava qui e trovava proposto il giorno
   * A anche il giorno in cui toccava il B: la scorciatoia principale della
   * schermata era quella sbagliata cinque volte su sei.
   */
  const nextDayIndex = useMemo(() => {
    if (days.length === 0) return -1;
    const lastFromRoutine = sessions.find(
      (session) => session.routineDayId && days.some((d) => d.day.id === session.routineDayId),
    );
    if (!lastFromRoutine) return 0;
    const previous = days.findIndex((d) => d.day.id === lastFromRoutine.routineDayId);
    return previous < 0 ? 0 : (previous + 1) % days.length;
  }, [days, sessions]);

  const nextDay = nextDayIndex >= 0 ? days[nextDayIndex] : undefined;
  const otherDays = days.filter((_, index) => index !== nextDayIndex);

  const week = useMemo(() => {
    // Lo stesso inizio settimana delle statistiche: due schermate che contano
    // gli allenamenti della settimana devono contarli dalla stessa mezzanotte,
    // o una delle due sembra sbagliata.
    const weekStartsOn = (settings.firstDayOfWeek % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const from = startOfWeek(new Date(), { weekStartsOn }).getTime();
    const inWeek = sessions.filter((session) => session.startedAt.getTime() >= from);
    return {
      count: inWeek.length,
      volume: inWeek.reduce((total, session) => total + session.totalVolume, 0),
      seconds: inWeek.reduce((total, session) => total + (session.durationSeconds ?? 0), 0),
    };
  }, [sessions, settings.firstDayOfWeek]);

  const goal = Math.max(1, settings.weeklySessionGoal);

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          // Il nome fa da titolo e il saluto scende nel sottotitolo: messi
          // insieme in cima — "Buon pomeriggio, Niccolò" — a corpo di titolo
          // non ci stavano, e la prima cosa che si leggeva dell'app era una
          // frase troncata a metà.
          title={settings.userName?.trim() || 'Oggi'}
          subtitle={`${greetingFor(now)} · ${format(now, 'EEEE d MMMM', { locale: it })}`}
          actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
        />
      }
      // L'allenamento libero era in fondo alla lista dei giorni: con una scheda
      // da cinque o sei giorni finiva sotto la piega. Qui non scorre mai via.
      actionBar={
        <ActionBar safeBottom={false}>
          <View style={{ flex: 1 }}>
            <Button
              title="Allenamento libero"
              variant={days.length > 0 ? 'secondary' : 'primary'}
              fullWidth
              icon={
                <MaterialCommunityIcons
                  name="plus"
                  size={18}
                  color={days.length > 0 ? theme.colors.text : theme.colors.onAccent}
                />
              }
              onPress={() => startWorkout(() => startEmptySession())}
            />
          </View>
        </ActionBar>
      }>
      <ScreenScroll gap={theme.space.lg} showsVerticalScrollIndicator={false}>
        {/* ─────────────────────────────────────────── la settimana in corso ── */}
        <Animated.View entering={FadeInDown.duration(theme.motion.duration.slow)}>
          <Card>
            <View style={[styles.week, { gap: theme.space.lg }]}>
              <ProgressRing value={week.count / goal} size={72} stroke={7}>
                <Text variant="metric" numeric>
                  {week.count}
                </Text>
                <Text variant="label" tone="faint">
                  su {goal}
                </Text>
              </ProgressRing>

              <View style={{ flex: 1, gap: theme.space.md }}>
                <Text variant="label" tone="dim">
                  Questa settimana
                </Text>
                <View style={[styles.weekStats, { gap: theme.space.lg }]}>
                  <Stat size="sm" label="Volume" value={formatVolume(week.volume, settings.unit)} />
                  <Stat size="sm" label="Tempo" value={formatDurationLong(week.seconds)} />
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* ───────────────────────────────────────── il prossimo allenamento ── */}
        {nextDay ? (
          <Animated.View entering={FadeInDown.delay(60).duration(theme.motion.duration.slow)}>
            <Card wash elevation="raised">
              <View style={{ gap: theme.space.lg }}>
                <View style={{ gap: theme.space.xs }}>
                  <Text variant="label" tone="accent">
                    {firstRoutine?.name}
                  </Text>
                  <Text variant="title" numberOfLines={2}>
                    {nextDay.day.name}
                  </Text>
                  <Text variant="caption" tone="dim">
                    {pluralize(nextDay.exerciseCount, 'esercizio', 'esercizi')}
                    {nextDay.day.notes ? ` · ${nextDay.day.notes}` : ''}
                  </Text>
                </View>

                <Button
                  title="Inizia l’allenamento"
                  size="lg"
                  fullWidth
                  icon={
                    <MaterialCommunityIcons name="play" size={20} color={theme.colors.onAccent} />
                  }
                  onPress={() => startWorkout(() => startSessionFromDay(nextDay.day.id))}
                />
              </View>
            </Card>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(60).duration(theme.motion.duration.slow)}>
            <Card wash>
              <View style={{ gap: theme.space.lg }}>
                <View style={{ gap: theme.space.sm }}>
                  <Text variant="title">Nessuna scheda</Text>
                  <Text
                    variant="body"
                    tone="dim"
                    style={{ lineHeight: theme.font.size.md * theme.font.lineHeight.normal }}>
                    Crea una scheda per avere i tuoi giorni pronti qui, oppure parti
                    libero e aggiungi gli esercizi man mano.
                  </Text>
                </View>
                <Button
                  title="Vai alle schede"
                  size="lg"
                  fullWidth
                  onPress={() => router.push('/routines')}
                />
              </View>
            </Card>
          </Animated.View>
        )}

        {/* ──────────────────────────────────────────── gli altri giorni ── */}
        {otherDays.length > 0 ? (
          <Animated.View
            entering={FadeInDown.delay(120).duration(theme.motion.duration.slow)}
            style={{ gap: theme.space.sm }}>
            <Section
              title="Gli altri giorni"
              action="Apri la scheda"
              onAction={() =>
                firstRoutine &&
                router.push({ pathname: '/routine/[id]', params: { id: firstRoutine.id } })
              }
            />
            {otherDays.map((entry) => (
              <Card key={entry.day.id} padded={false}>
                <View style={[styles.dayRow, { padding: theme.space.md, gap: theme.space.md }]}>
                  <View style={{ flex: 1, gap: theme.space.xs, paddingLeft: theme.space.xs }}>
                    <Text variant="subtitle" numberOfLines={1}>
                      {entry.day.name}
                    </Text>
                    <Text variant="caption" tone="faint">
                      {pluralize(entry.exerciseCount, 'esercizio', 'esercizi')}
                    </Text>
                  </View>
                  <PlayButton onPress={() => startWorkout(() => startSessionFromDay(entry.day.id))} />
                </View>
              </Card>
            ))}
          </Animated.View>
        ) : null}

        {/* ────────────────────────────────────────── l'ultimo allenamento ── */}
        {lastSession ? (
          <Animated.View
            entering={FadeInDown.delay(180).duration(theme.motion.duration.slow)}
            style={{ gap: theme.space.sm }}>
            <Section title="L’ultima volta" action="Storico" onAction={() => router.push('/history')} />
            <Card
              onPress={() =>
                router.push({ pathname: '/session/[id]', params: { id: lastSession.id } })
              }>
              <View style={{ gap: theme.space.lg }}>
                <View style={{ gap: theme.space.xs }}>
                  <Text variant="heading" numberOfLines={1}>
                    {lastSession.name}
                  </Text>
                  <Text variant="caption" tone="faint">
                    {formatSessionDate(lastSession.startedAt)}
                  </Text>
                </View>

                <View style={[styles.weekStats, { gap: theme.space.xl }]}>
                  <Stat
                    size="sm"
                    label="Durata"
                    value={formatDurationLong(lastSession.durationSeconds ?? 0)}
                  />
                  <Stat
                    size="sm"
                    label="Volume"
                    value={formatVolume(lastSession.totalVolume, settings.unit)}
                  />
                  <Stat size="sm" label="Serie" value={String(lastSession.totalSets)} />
                </View>
              </View>
            </Card>
          </Animated.View>
        ) : null}

        {/* ──────────────────────────────────────────────────── la libreria ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(theme.motion.duration.slow)}>
          <Card onPress={() => router.push('/exercises')} padded={false}>
            <View style={[styles.dayRow, { padding: theme.space.lg, gap: theme.space.md }]}>
              <Surface level="mid" radius={capsule(GLYPH)} bordered={false} style={styles.glyph}>
                <MaterialCommunityIcons name="dumbbell" size={20} color={theme.colors.accent} />
              </Surface>
              <View style={{ flex: 1, gap: theme.space.xs }}>
                <Text variant="subtitle">Libreria esercizi</Text>
                <Text variant="caption" tone="faint">
                  {pluralize(exerciseCount?.[0]?.value ?? 0, 'esercizio', 'esercizi')} disponibili
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={theme.colors.textFaint}
              />
            </View>
          </Card>
        </Animated.View>
      </ScreenScroll>
    </Screen>
  );
}

/** Il tondo con il triangolo: far partire un giorno senza aprirlo. */
function PlayButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Inizia questo allenamento"
      style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <View
        style={[
          styles.play,
          { borderRadius: capsule(PLAY), backgroundColor: theme.colors.accent },
        ]}>
        <MaterialCommunityIcons name="play" size={22} color={theme.colors.onAccent} />
      </View>
    </Pressable>
  );
}

/** Il bersaglio del play: 48, come tutto ciò che si tocca in palestra. */
const PLAY = 48;
/** Il disco di un'icona in una riga. */
const GLYPH = 40;

const styles = StyleSheet.create({
  week: { flexDirection: 'row', alignItems: 'center' },
  weekStats: { flexDirection: 'row' },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  play: { width: PLAY, height: PLAY, alignItems: 'center', justifyContent: 'center' },
  glyph: { width: GLYPH, height: GLYPH, alignItems: 'center', justifyContent: 'center' },
});

import { count, desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { routineDaysQuery, routineListQuery } from '@/db/queries/routines';
import { startEmptySession, startSessionFromDay } from '@/db/queries/sessions';
import { exercises, workoutSessions } from '@/db/schema';
import { startWorkout } from '@/features/session/start';
import { formatDurationLong, formatSessionDate } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function TodayScreen() {
  const theme = useTheme();
  const { settings } = useSettings();

  const { data: exerciseCount } = useLiveQuery(db.select({ value: count() }).from(exercises));
  const { data: routineRows } = useLiveQuery(routineListQuery());
  const { data: lastRows } = useLiveQuery(
    db
      .select()
      .from(workoutSessions)
      .where(eq(workoutSessions.status, 'completed'))
      .orderBy(desc(workoutSessions.startedAt))
      .limit(1),
  );

  // Il giorno da proporre viene dalla prima scheda: è quella che si sta
  // seguendo nella stragrande maggioranza dei casi.
  const firstRoutine = routineRows?.[0];
  const { data: dayRows } = useLiveQuery(
    useMemo(() => routineDaysQuery(firstRoutine?.id ?? ''), [firstRoutine?.id]),
    [firstRoutine?.id],
  );

  const days = dayRows ?? [];
  const lastSession = lastRows?.[0];

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={settings.userName ? `OpenFit - ${settings.userName}` : 'Pronto ad allenarti?'}
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
              onPress={() => startWorkout(() => startEmptySession())}
            />
          </View>
        </ActionBar>
      }>
      <ScreenScroll gap={theme.space.lg} showsVerticalScrollIndicator={false}>
        {days.length > 0 ? (
          <View style={{ gap: theme.space.sm }}>
            <Text variant="label" tone="dim">
              {firstRoutine?.name}
            </Text>
            {days.map((day) => (
              <Card key={day.id}>
                <View style={styles.dayRow}>
                  <Text variant="subtitle" style={{ flex: 1 }} numberOfLines={1}>
                    {day.name}
                  </Text>
                  <Button
                    title="Inizia"
                    size="sm"
                    onPress={() => startWorkout(() => startSessionFromDay(day.id))}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <Card>
            <View style={{ gap: theme.space.md }}>
              <Text variant="heading">Nessuna scheda</Text>
              <Text variant="caption" tone="dim">
                Crea una scheda per avere i tuoi giorni pronti qui, oppure parti
                libero e aggiungi gli esercizi man mano.
              </Text>
              <Button title="Vai alle schede" variant="secondary" fullWidth onPress={() => router.push('/routines')} />
            </View>
          </Card>
        )}

        {lastSession ? (
          <Card onPress={() => router.push({ pathname: '/session/[id]', params: { id: lastSession.id } })}>
            <View style={{ gap: 4 }}>
              <Text variant="label" tone="dim">
                Ultimo allenamento
              </Text>
              <Text variant="heading" numberOfLines={1}>
                {lastSession.name}
              </Text>
              <Text variant="caption" tone="faint">
                {formatSessionDate(lastSession.startedAt)} ·{' '}
                {formatDurationLong(lastSession.durationSeconds ?? 0)} ·{' '}
                {formatVolume(lastSession.totalVolume, settings.unit)} ·{' '}
                {lastSession.totalSets} {lastSession.totalSets === 1 ? 'serie' : 'serie'}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card onPress={() => router.push('/exercises')}>
          <Text variant="label" tone="dim">
            Libreria
          </Text>
          <Text variant="display" numeric>
            {exerciseCount?.[0]?.value ?? 0}
          </Text>
          <Text variant="caption" tone="dim">
            esercizi disponibili
          </Text>
        </Card>
      </ScreenScroll>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

import { format, isSameDay, isSameMonth } from 'date-fns';
import { it } from 'date-fns/locale';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { Stat } from '@/components/ui/stat';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { sessionHistoryQuery } from '@/db/queries/sessions';
import { formatDurationLong, formatTime, pluralize } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

/**
 * Titolo del blocco a cui una data appartiene.
 *
 * "Questa settimana / Prima" erano due soli scaglioni: con sei mesi di
 * allenamenti dentro, "Prima" era una lista di ottanta card senza un appiglio.
 * Il mese è l'unità con cui si ragiona quando si va a cercare qualcosa nello
 * storico ("a marzo che facevo?"), e l'anno compare solo quando serve.
 */
function bucketFor(date: Date, now: Date): string {
  if (isSameMonth(date, now)) return 'Questo mese';
  const sameYear = date.getFullYear() === now.getFullYear();
  return format(date, sameYear ? 'LLLL' : 'LLLL yyyy', { locale: it });
}

export default function HistoryScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { data } = useLiveQuery(sessionHistoryQuery());
  const sessions = useMemo(() => data ?? [], [data]);

  const now = new Date();

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title="Storico"
          subtitle={
            sessions.length > 0 ? pluralize(sessions.length, 'allenamento', 'allenamenti') : undefined
          }
          actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
        />
      }>
      {sessions.length === 0 ? (
        <EmptyState
          icon="calendar-blank-outline"
          title="Ancora niente"
          description="Gli allenamenti che concludi finiscono qui, con volume, serie e record."
        />
      ) : (
        <ScreenScroll gap={theme.space.sm} showsVerticalScrollIndicator={false}>
          {sessions.map((session, index) => {
            const bucket = bucketFor(session.startedAt, now);
            const previous = sessions[index - 1];
            const isFirstOfBucket = !previous || bucketFor(previous.startedAt, now) !== bucket;

            return (
              <View key={session.id} style={{ gap: theme.space.sm }}>
                {isFirstOfBucket ? (
                  <Section
                    title={bucket}
                    style={{
                      // Aria sopra il titolo di un blocco, ma non sopra il primo:
                      // lì c'è già il margine dello scroll.
                      marginTop: index === 0 ? 0 : theme.space.lg,
                      paddingHorizontal: theme.space.xs,
                    }}
                  />
                ) : null}

                <Animated.View entering={FadeIn.duration(theme.motion.duration.normal)}>
                  <Card
                    padded={false}
                    onPress={() =>
                      router.push({ pathname: '/session/[id]', params: { id: session.id } })
                    }>
                    <View style={{ padding: theme.space.lg, gap: theme.space.lg }}>
                      <View style={[styles.head, { gap: theme.space.md }]}>
                        <DateBadge date={session.startedAt} today={isSameDay(session.startedAt, now)} />
                        <View style={{ flex: 1, gap: theme.space.xs }}>
                          <Text variant="heading" numberOfLines={1}>
                            {session.name}
                          </Text>
                          <Text variant="caption" tone="faint">
                            {format(session.startedAt, 'EEEE', { locale: it })} · alle{' '}
                            {formatTime(session.startedAt)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.stats, { gap: theme.space.xl }]}>
                        <Stat
                          size="sm"
                          label="Durata"
                          value={formatDurationLong(session.durationSeconds ?? 0)}
                        />
                        <Stat
                          size="sm"
                          label="Volume"
                          value={formatVolume(session.totalVolume, settings.unit)}
                        />
                        <Stat size="sm" label="Serie" value={String(session.totalSets)} />
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              </View>
            );
          })}
        </ScreenScroll>
      )}
    </Screen>
  );
}

/**
 * Il quadratino con giorno e mese.
 *
 * La data era una riga di testo grigia a destra del nome, e per trovare un
 * allenamento bisognava leggere ogni card. Un blocco alla stessa posizione in
 * tutte le card si scorre con l'occhio senza leggere niente.
 */
function DateBadge({ date, today }: { date: Date; today: boolean }) {
  const theme = useTheme();

  return (
    <Surface
      level="mid"
      radius={theme.radius.md}
      tinted={today}
      bordered={!today}
      style={styles.badge}>
      <Text variant="metric" tone={today ? 'accent' : 'default'} numeric>
        {format(date, 'd')}
      </Text>
      <Text variant="label" tone={today ? 'accent' : 'faint'}>
        {format(date, 'LLL', { locale: it })}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  stats: { flexDirection: 'row' },
  badge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', gap: 1 },
});

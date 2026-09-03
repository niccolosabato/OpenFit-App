import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { sessionHistoryQuery } from '@/db/queries/sessions';
import { formatDurationLong, formatSessionDate, formatTime } from '@/lib/format';
import { formatVolume } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function HistoryScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { data } = useLiveQuery(sessionHistoryQuery());
  const sessions = data ?? [];

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Storico"
        subtitle={sessions.length > 0 ? `${sessions.length} allenamenti` : undefined}
      />

      {sessions.length === 0 ? (
        <EmptyState
          icon="history"
          title="Ancora niente"
          description="Gli allenamenti che concludi finiscono qui, con volume, serie e record."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md, paddingBottom: theme.space.xxxl }}>
          {sessions.map((session) => (
            <Card
              key={session.id}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: session.id } })}>
              <View style={{ gap: theme.space.sm }}>
                <View style={styles.head}>
                  <Text variant="subtitle" style={{ flex: 1 }} numberOfLines={1}>
                    {session.name}
                  </Text>
                  <Text variant="caption" tone="dim">
                    {formatSessionDate(session.startedAt)}
                  </Text>
                </View>

                <View style={[styles.stats, { gap: theme.space.lg }]}>
                  <Metric label="Durata" value={formatDurationLong(session.durationSeconds ?? 0)} />
                  <Metric label="Volume" value={formatVolume(session.totalVolume, settings.unit)} />
                  <Metric label="Serie" value={String(session.totalSets)} />
                </View>

                <Text variant="caption" tone="faint">
                  Iniziato alle {formatTime(session.startedAt)}
                </Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text variant="label" tone="faint">
        {label}
      </Text>
      <Text variant="subtitle" numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stats: { flexDirection: 'row' },
});

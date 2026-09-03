import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { count } from 'drizzle-orm';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { db } from '@/db/client';
import { exercises } from '@/db/schema';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export default function TodayScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { data: exerciseCount } = useLiveQuery(db.select({ value: count() }).from(exercises));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: theme.space.lg, paddingVertical: theme.space.lg }}>
        <View>
          <Text variant="label" tone="dim">
            Oggi
          </Text>
          <Text variant="title">
            {settings.userName ? `Ciao, ${settings.userName}` : 'Pronto ad allenarti?'}
          </Text>
        </View>

        <Card>
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({});

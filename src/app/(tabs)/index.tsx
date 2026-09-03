import { count } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
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
    <Screen padded={false}>
      <ScreenHeader
        title={settings.userName ? `Ciao, ${settings.userName}` : 'Pronto ad allenarti?'}
        subtitle="Nessun allenamento in corso"
        actions={[{ icon: 'cog-outline', label: 'Profilo', onPress: () => router.push('/profile') }]}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg, paddingBottom: theme.space.xxxl }}
        showsVerticalScrollIndicator={false}>
        <Card>
          <View style={{ gap: theme.space.md }}>
            <Text variant="heading">Inizia un allenamento</Text>
            <Text variant="caption" tone="dim">
              Scegli un giorno da una scheda oppure parti libero e aggiungi gli esercizi
              man mano.
            </Text>
            <Button
              title="Allenamento libero"
              variant="secondary"
              fullWidth
              onPress={() => router.push('/routines')}
            />
          </View>
        </Card>

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
      </ScrollView>
    </Screen>
  );
}

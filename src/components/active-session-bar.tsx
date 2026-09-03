import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { activeSessionQuery } from '@/db/queries/sessions';
import { formatDuration } from '@/lib/format';
import { useRestCountdown } from '@/features/timer/use-countdown';
import { useTheme } from '@/theme';

/**
 * Barra "allenamento in corso", sopra la tab bar.
 *
 * Durante una seduta si esce di continuo dalla sessione — per guardare lo
 * storico di un esercizio, per cercarne uno da aggiungere — e senza questa
 * barra tornare indietro sarebbe un rompicapo. Mostra anche il recupero, così
 * il countdown resta visibile ovunque nell'app.
 */
export function ActiveSessionBar() {
  const theme = useTheme();
  const { data } = useLiveQuery(activeSessionQuery());
  const session = data?.[0];
  const { remaining, running } = useRestCountdown();

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!session) return;
    const update = () =>
      setElapsed(Math.max(0, Math.round((Date.now() - session.startedAt.getTime()) / 1000)));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (!session) return null;

  return (
    <Pressable
      onPress={() => router.push('/session/active')}
      accessibilityRole="button"
      accessibilityLabel="Torna all’allenamento in corso"
      style={({ pressed }) => [
        styles.root,
        {
          backgroundColor: running ? theme.colors.accent : theme.colors.surface3,
          borderTopColor: theme.colors.borderStrong,
          paddingHorizontal: theme.space.lg,
          paddingVertical: theme.space.md,
          gap: theme.space.md,
        },
        pressed && { opacity: 0.85 },
      ]}>
      <MaterialCommunityIcons
        name={running ? 'timer-sand' : 'dumbbell'}
        size={20}
        color={running ? theme.colors.onAccent : theme.colors.accent}
      />
      <View style={{ flex: 1 }}>
        <Text variant="label" tone={running ? 'onAccent' : 'dim'} numberOfLines={1}>
          {running ? 'Recupero' : 'Allenamento in corso'}
        </Text>
        <Text variant="subtitle" tone={running ? 'onAccent' : 'default'} numeric numberOfLines={1}>
          {running ? formatDuration(remaining) : `${session.name} · ${formatDuration(elapsed)}`}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-up"
        size={22}
        color={running ? theme.colors.onAccent : theme.colors.textDim}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth * 2 },
});

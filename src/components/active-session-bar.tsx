import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Surface } from '@/components/ui/surface';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { activeSessionQuery } from '@/db/queries/sessions';
import { formatDuration } from '@/lib/format';
import { useRestTimer } from '@/features/timer/rest-timer';
import { useRestCountdown } from '@/features/timer/use-countdown';
import { useTheme } from '@/theme';

/**
 * Barra "allenamento in corso", sopra la tab bar.
 *
 * Durante una seduta si esce di continuo dalla sessione — per guardare lo
 * storico di un esercizio, per cercarne uno da aggiungere — e senza questa
 * barra tornare indietro sarebbe un rompicapo. Mostra anche il recupero, così
 * il countdown resta visibile ovunque nell'app.
 *
 * Quando il recupero gira la barra si tinge d'accento: il countdown si trova
 * con la coda dell'occhio da qualunque schermata.
 */
export function ActiveSessionBar() {
  const theme = useTheme();
  const { data } = useLiveQuery(activeSessionQuery());
  const session = data?.[0];
  const { remaining, running } = useRestCountdown();
  const stopRest = useRestTimer((state) => state.stop);

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
      accessibilityLabel="Torna all’allenamento in corso">
      {({ pressed }) => (
        <Surface
          level="high"
          radius={0}
          tinted={running}
          pressed={pressed}
          style={[
            styles.root,
            {
              paddingHorizontal: theme.space.lg,
              paddingVertical: theme.space.sm,
              gap: theme.space.md,
              borderLeftWidth: 0,
              borderRightWidth: 0,
              borderBottomWidth: 0,
            },
          ]}>
          <MaterialCommunityIcons
            name={running ? 'timer-sand' : 'dumbbell'}
            size={22}
            color={theme.colors.accent}
          />
          <View style={{ flex: 1 }}>
            <Text variant="label" tone={running ? 'accent' : 'dim'} numberOfLines={1}>
              {running ? 'Recupero' : 'Allenamento in corso'}
            </Text>
            <Text variant="subtitle" numeric numberOfLines={1}>
              {running ? formatDuration(remaining) : `${session.name} · ${formatDuration(elapsed)}`}
            </Text>
          </View>
          {/* Saltare il recupero senza rientrare in sessione: durante una
              seduta è la ragione principale per cui si tornava indietro. */}
          {running ? (
            <IconButton
              icon="skip-next"
              label="Salta il recupero"
              tone="accent"
              onPress={stopRest}
            />
          ) : null}
          <MaterialCommunityIcons name="chevron-up" size={22} color={theme.colors.textDim} />
        </Surface>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
});

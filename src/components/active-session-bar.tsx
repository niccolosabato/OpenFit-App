import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FloatingBand } from '@/components/ui/floating-band';
import { IconButton } from '@/components/ui/icon-button';
import { ProgressBar } from '@/components/ui/progress';
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
  const { remaining, total, running, paused } = useRestCountdown();
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
    // Sopra la tab bar, con lo stesso distacco dai bordi: le due barre si
    // leggono come una pila di elementi appoggiati, non come una fascia unica.
    <FloatingBand
      edge="bottom"
      bottomInset="none"
      fade={false}
      tinted={running}
      onPress={() => router.push('/session/active')}
      accessibilityLabel="Torna all’allenamento in corso"
      surfaceStyle={{
        paddingLeft: theme.space.lg,
        paddingRight: theme.space.sm,
        paddingVertical: theme.space.sm,
      }}>
      {/* Il recupero si legge anche senza leggere: la barra si svuota, e il
          colpo d'occhio da tre metri di distanza basta a sapere se è ora di
          tornare sotto il bilanciere. */}
      {running ? (
        <View style={{ paddingBottom: theme.space.sm, paddingRight: theme.space.sm }}>
          <ProgressBar
            value={total > 0 ? remaining / total : 0}
            height={3}
            color={paused ? theme.colors.textFaint : theme.colors.accent}
            trackColor={theme.colors.surface3}
          />
        </View>
      ) : null}

      <View style={[styles.root, { gap: theme.space.md }]}>
        <MaterialCommunityIcons
          name={running ? 'timer-sand' : 'dumbbell'}
          size={22}
          color={theme.colors.accent}
        />
        <View style={{ flex: 1, gap: theme.space.xs }}>
          <Text variant="label" tone={running ? 'accent' : 'dim'} numberOfLines={1}>
            {running ? `Recupero${paused ? ' · in pausa' : ''}` : 'Allenamento in corso'}
          </Text>
          <Text variant="subtitle" numeric numberOfLines={1}>
            {running ? formatDuration(remaining) : `${session.name} · ${formatDuration(elapsed)}`}
          </Text>
        </View>
      {/* Saltare il recupero senza rientrare in sessione: durante una
          seduta è la ragione principale per cui si tornava indietro. */}
        {running ? (
          <IconButton icon="skip-next" label="Salta il recupero" tone="accent" onPress={stopRest} />
        ) : (
          <IconButton
            icon="chevron-up"
            label="Riapri l’allenamento"
            tone="dim"
            onPress={() => router.push('/session/active')}
          />
        )}
      </View>
    </FloatingBand>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
});

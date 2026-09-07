import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress';
import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { formatDuration } from '@/lib/format';
import { useSettings } from '@/store/settings';
import { capsule, useTheme } from '@/theme';
import { REST_ADJUST_STEP, useRestTimer } from './rest-timer';
import { useRestCountdown } from './use-countdown';

/**
 * Barra del recupero, ancorata in fondo alla sessione.
 *
 * Il numero è grande e centrato perché lo si legge da un metro di distanza,
 * con il telefono appoggiato sulla panca e mentre si respira: è l'unica cosa
 * che conta finché il timer gira, e sta al centro del campo visivo invece che
 * in un angolo.
 *
 * Non si occupa dell'area sicura in fondo: sta dentro una `ActionBar`, che
 * gliela garantisce.
 */
export function RestTimerBar() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { remaining, total, running, paused } = useRestCountdown();
  const label = useRestTimer((s) => s.label);
  const adjust = useRestTimer((s) => s.adjust);
  const pause = useRestTimer((s) => s.pause);
  const resume = useRestTimer((s) => s.resume);
  const stop = useRestTimer((s) => s.stop);

  if (!running) return null;

  const progress = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const options = { sound: settings.timerSound, notify: settings.timerNotification };

  return (
    <View style={[styles.root, { gap: theme.space.md }]}>
      <View style={{ gap: theme.space.xs }}>
        <Text variant="label" tone={paused ? 'dim' : 'accent'} numberOfLines={1} style={styles.centered}>
          Recupero{label ? ` · ${label}` : ''}
          {paused ? ' · in pausa' : ''}
        </Text>
        <Text
          variant="display"
          tone={paused ? 'dim' : 'accent'}
          numeric
          style={[styles.countdown, { fontSize: COUNTDOWN, lineHeight: COUNTDOWN * 1.06 }]}>
          {formatDuration(remaining)}
        </Text>
      </View>

      <ProgressBar
        value={progress}
        height={6}
        color={paused ? theme.colors.textFaint : theme.colors.accent}
        trackColor={theme.colors.surface2}
      />

      {/* Riga a sé e non accanto al numero: con quattro bersagli da 48dp il
          countdown si sarebbe schiacciato in uno spazio troppo stretto per
          leggerlo da un braccio di distanza. */}
      <View style={styles.row}>
        <TimerButton
          icon="minus"
          label={`Togli ${REST_ADJUST_STEP} secondi`}
          onPress={() => adjust(-REST_ADJUST_STEP, options)}
        />
        <TimerButton
          icon={paused ? 'play' : 'pause'}
          label={paused ? 'Riprendi il recupero' : 'Metti in pausa il recupero'}
          onPress={() => (paused ? resume(options) : pause())}
        />
        <TimerButton
          icon="plus"
          label={`Aggiungi ${REST_ADJUST_STEP} secondi`}
          onPress={() => adjust(REST_ADJUST_STEP, options)}
        />
        <TimerButton icon="skip-forward" label="Salta il recupero" onPress={stop} emphasis />
      </View>
    </View>
  );
}

function TimerButton({
  icon,
  label,
  onPress,
  emphasis,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  emphasis?: boolean;
}) {
  const theme = useTheme();
  const box = { width: theme.hit, height: theme.hit };

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) =>
        emphasis ? (
          <View
            style={[
              styles.button,
              box,
              { borderRadius: capsule(theme.hit), backgroundColor: theme.colors.accent },
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.onAccent} />
          </View>
        ) : (
          <Surface level="mid" radius={capsule(theme.hit)} pressed={pressed} style={[styles.button, box]}>
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.text} />
          </Surface>
        )
      }
    </Pressable>
  );
}

/**
 * Il corpo del countdown.
 *
 * Non è un token perché non è una taglia del sistema: è la misura che questo
 * numero deve avere per leggersi appoggiato sulla panca, e serve solo qui.
 */
const COUNTDOWN = 56;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  centered: { textAlign: 'center' },
  countdown: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
  button: { alignItems: 'center', justifyContent: 'center' },
});

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { formatDuration } from '@/lib/format';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';
import { REST_ADJUST_STEP, useRestTimer } from './rest-timer';
import { useRestCountdown } from './use-countdown';

/**
 * Barra del recupero, ancorata in fondo alla sessione.
 *
 * Il numero è grande perché lo si legge da un metro di distanza, con il
 * telefono appoggiato sulla panca e mentre si respira.
 *
 * Non si occupa più dell'area sicura in fondo: sta dentro una `ActionBar`,
 * che gliela garantisce. Prima la gestiva da sé — e non la applicava, così i
 * tre pulsanti finivano sotto la barra dei gesti del telefono.
 */
export function RestTimerBar() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { remaining, total, running } = useRestCountdown();
  const label = useRestTimer((s) => s.label);
  const adjust = useRestTimer((s) => s.adjust);
  const stop = useRestTimer((s) => s.stop);

  if (!running) return null;

  const progress = total > 0 ? Math.min(1, Math.max(0, remaining / total)) : 0;
  const options = { sound: settings.timerSound, notify: settings.timerNotification };

  return (
    <View style={[styles.root, { gap: theme.space.md }]}>
      <View style={[styles.track, { backgroundColor: theme.colors.surface2 }]}>
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.colors.accent, width: `${progress * 100}%` },
          ]}
        />
      </View>

      <View style={[styles.row, { gap: theme.space.md }]}>
        <View style={{ flex: 1 }}>
          <Text variant="label" tone="dim" numberOfLines={1}>
            Recupero{label ? ` · ${label}` : ''}
          </Text>
          <Text variant="display" tone="accent" numeric>
            {formatDuration(remaining)}
          </Text>
        </View>

        <TimerButton
          icon="minus"
          label={`Togli ${REST_ADJUST_STEP} secondi`}
          onPress={() => adjust(-REST_ADJUST_STEP, options)}
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
              { borderRadius: theme.radius.pill, backgroundColor: theme.colors.accent },
              pressed && styles.pressed,
            ]}>
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.onAccent} />
          </View>
        ) : (
          <Surface
            level="mid"
            radius={theme.radius.pill}
            pressed={pressed}
            style={[styles.button, box]}>
            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.text} />
          </Surface>
        )
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pressed: { opacity: 0.6 },
  button: { alignItems: 'center', justifyContent: 'center' },
});

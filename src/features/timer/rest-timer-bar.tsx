import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, View } from 'react-native';

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
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.borderStrong,
          paddingHorizontal: theme.space.lg,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.md,
          gap: theme.space.md,
        },
      ]}>
      <View style={[styles.track, { backgroundColor: theme.colors.surface3 }]}>
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          width: theme.hit,
          height: theme.hit,
          borderRadius: theme.radius.md,
          backgroundColor: emphasis ? theme.colors.accent : theme.colors.surface2,
          borderColor: emphasis ? theme.colors.accent : theme.colors.border,
        },
        pressed && { opacity: 0.6 },
      ]}>
      <MaterialCommunityIcons
        name={icon}
        size={22}
        color={emphasis ? theme.colors.onAccent : theme.colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});

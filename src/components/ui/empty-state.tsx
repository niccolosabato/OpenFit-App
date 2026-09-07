import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from './button';
import { Surface } from './surface';
import { Text } from './text';
import { capsule, useTheme } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * Stato vuoto: dice cosa manca e offre l'azione per riempirlo.
 *
 * Il disco dell'icona ha un alone d'accento intorno invece di essere un
 * cerchio grigio: uno stato vuoto è comunque una schermata dell'app, non un
 * errore, e trattarlo tutto in grigio lo faceva sembrare rotto.
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(theme.motion.duration.slow)}
      style={[styles.root, { gap: theme.space.md, padding: theme.space.xl }]}>
      <View style={[styles.halo, { backgroundColor: theme.colors.accentHalo }]}>
        <Surface level="mid" radius={capsule(BADGE)} style={styles.badge}>
          <MaterialCommunityIcons name={icon} size={38} color={theme.colors.accent} />
        </Surface>
      </View>

      <View style={{ gap: theme.space.sm, marginTop: theme.space.sm }}>
        <Text variant="heading" style={styles.center}>
          {title}
        </Text>
        {description ? (
          <Text
            variant="body"
            tone="dim"
            style={[
              styles.center,
              styles.description,
              { lineHeight: theme.font.size.md * theme.font.lineHeight.normal },
            ]}>
            {description}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} size="lg" style={{ marginTop: theme.space.sm }} />
      ) : null}
    </Animated.View>
  );
}

/** Il disco dell'icona e il suo alone: misure e raggi da due numeri soli. */
const BADGE = 88;
const HALO = 128;

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  halo: {
    width: HALO,
    height: HALO,
    borderRadius: capsule(HALO),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: { width: BADGE, height: BADGE, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  description: { maxWidth: 320 },
});

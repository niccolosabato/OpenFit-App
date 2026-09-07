import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

/**
 * Titolo di una sezione dentro uno scroll, con un'azione facoltativa a destra.
 *
 * Prima ogni schermata scriveva la propria `<Text variant="label">` con
 * margini decisi a occhio: le sezioni di "Oggi" e quelle dello storico
 * finivano a due distanze diverse da ciò che introducevano.
 */
export function Section({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.row, { gap: theme.space.md, minHeight: 24 }, style]}>
      <Text variant="label" tone="dim" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {action && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          hitSlop={12}
          style={({ pressed }) => pressed && styles.pressed}>
          <Text variant="caption" weight="semibold" tone="accent">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Filo di separazione fra due righe della stessa superficie. */
export function Divider({ inset = 0 }: { inset?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth * 2,
        marginLeft: inset,
        backgroundColor: theme.colors.border,
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { flex: 1 },
  pressed: { opacity: 0.6 },
});

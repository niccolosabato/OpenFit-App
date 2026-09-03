import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Text } from './text';
import { useTheme } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Stato vuoto: dice cosa manca e offre l'azione per riempirlo. */
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
    <View style={[styles.root, { gap: theme.space.md, padding: theme.space.xl }]}>
      <MaterialCommunityIcons name={icon} size={44} color={theme.colors.textFaint} />
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {description ? (
        <Text variant="caption" tone="dim" style={styles.center}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={{ marginTop: theme.space.sm }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});

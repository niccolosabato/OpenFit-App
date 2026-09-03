import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type HeaderAction = {
  icon: IconName;
  label: string;
  onPress: () => void;
};

/** Intestazione di schermata: titolo, ritorno indietro, azioni a destra. */
export function ScreenHeader({
  title,
  subtitle,
  showBack,
  actions = [],
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  actions?: HeaderAction[];
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          paddingHorizontal: theme.space.lg,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.lg,
          gap: theme.space.md,
        },
      ]}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Indietro"
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={theme.colors.text} />
        </Pressable>
      ) : null}

      <View style={styles.titles}>
        <Text variant="title" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="dim" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [
            styles.action,
            {
              backgroundColor: theme.colors.surface2,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
            pressed && { opacity: 0.6 },
          ]}>
          <MaterialCommunityIcons name={action.icon} size={20} color={theme.colors.text} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center' },
  titles: { flex: 1, gap: 2 },
  action: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});

/**
 * Tab bar dell'app.
 *
 * Scritta a mano invece di usare quella di sistema per due ragioni: deve
 * rispettare i token del tema (fondo carbone, bordo netto, accento
 * configurabile) e ogni voce deve essere alta almeno `theme.hit`, perché la si
 * tocca anche a mani sudate fra una serie e l'altra.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Icona e etichetta per ogni rotta di primo livello. */
const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Oggi', icon: 'dumbbell', iconActive: 'dumbbell' },
  routines: { label: 'Schede', icon: 'clipboard-list-outline', iconActive: 'clipboard-list' },
  history: { label: 'Storico', icon: 'history', iconActive: 'history' },
  stats: { label: 'Statistiche', icon: 'chart-timeline-variant', iconActive: 'chart-timeline-variant-shimmer' },
  profile: { label: 'Profilo', icon: 'cog-outline', iconActive: 'cog' },
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, theme.space.sm),
        },
      ]}>
      {state.routes.map((route, index) => {
        const config = TABS[route.name];
        if (!config) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={config.label}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, { minHeight: theme.hit }, pressed && styles.pressed]}>
            <MaterialCommunityIcons
              name={isFocused ? config.iconActive : config.icon}
              size={23}
              color={isFocused ? theme.colors.accent : theme.colors.textFaint}
            />
            <Text
              variant="label"
              tone={isFocused ? 'accent' : 'faint'}
              style={styles.label}
              numberOfLines={1}>
              {config.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  pressed: { opacity: 0.6 },
  label: { fontSize: 10, letterSpacing: 0.4 },
});

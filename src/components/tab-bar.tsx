/**
 * Tab bar dell'app.
 *
 * Scritta a mano invece di usare quella di sistema per due ragioni: deve
 * rispettare i token del tema (vetro, accento configurabile) e ogni voce deve
 * essere alta almeno `theme.hit`, perché la si tocca anche a mani sudate fra
 * una serie e l'altra.
 *
 * È l'elemento in cui il vetro si vede meglio: il contenuto delle schermate le
 * scorre sotto e si intravede sfocato, invece di fermarsi contro una fascia
 * opaca. La voce attiva è una pastiglia d'accento, non solo un colore diverso.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useSegments } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Glass } from '@/components/ui/glass';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

import type { Href } from 'expo-router';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Tab = { name: string; href: Href; label: string; icon: IconName; iconActive: IconName };

/**
 * Le voci, in ordine. Sono dichiarate qui e non ricavate dallo stato del
 * navigatore perché la barra vive *fuori* da `<Tabs>`: deve stare sopra le
 * schermate per poterle sfocare, e da lì lo stato del navigatore non arriva.
 * La rotta attiva si legge dai segmenti del router.
 */
const TABS: Tab[] = [
  { name: 'index', href: '/', label: 'Oggi', icon: 'dumbbell', iconActive: 'dumbbell' },
  { name: 'routines', href: '/routines', label: 'Schede', icon: 'clipboard-list-outline', iconActive: 'clipboard-list' },
  { name: 'exercises', href: '/exercises', label: 'Esercizi', icon: 'weight-lifter', iconActive: 'weight-lifter' },
  { name: 'history', href: '/history', label: 'Storico', icon: 'history', iconActive: 'history' },
  { name: 'stats', href: '/stats', label: 'Statistiche', icon: 'chart-timeline-variant', iconActive: 'chart-timeline-variant-shimmer' },
];

export function TabBar() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // Dentro `(tabs)` il secondo segmento è il nome della rotta; sulla schermata
  // iniziale non c'è e vale `index`.
  const current = segments[0] === '(tabs)' ? (segments[1] ?? 'index') : 'index';

  return (
    <Glass
      level="high"
      elevation="high"
      blur
      radius={0}
      sheen={false}
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, theme.space.sm),
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
        },
      ]}>
      {TABS.map((config) => {
        const isFocused = current === config.name;

        const onPress = () => {
          if (!isFocused) router.navigate(config.href);
        };

        return (
          <Pressable
            key={config.name}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={config.label}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, { minHeight: theme.hit }, pressed && styles.pressed]}>
            <View
              style={[
                styles.pill,
                {
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: theme.space.md,
                  backgroundColor: isFocused ? theme.colors.accentTint : 'transparent',
                },
              ]}>
              <MaterialCommunityIcons
                name={isFocused ? config.iconActive : config.icon}
                size={24}
                color={isFocused ? theme.colors.accent : theme.colors.textFaint}
              />
            </View>
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
    </Glass>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  pill: { paddingVertical: 3, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  label: { fontSize: 10, letterSpacing: 0.4 },
});

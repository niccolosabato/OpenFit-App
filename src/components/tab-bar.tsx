/**
 * Tab bar dell'app.
 *
 * Scritta a mano invece di usare quella di sistema per due ragioni: deve
 * rispettare i token del tema (fondo carbone, bordo netto, accento
 * configurabile) e ogni voce deve
 * essere alta almeno `theme.hit`, perché la si tocca anche a mani sudate fra
 * una serie e l'altra.
 *
 * Sta sopra il contenuto invece che nel flusso, così resta ferma mentre le
 * schermate scorrono. La voce attiva è una pastiglia d'accento, non solo un
 * colore diverso.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useSegments } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { capsule, useTheme } from '@/theme';

import type { Href } from 'expo-router';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Altezza della pastiglia dietro la voce attiva; il raggio è la sua metà. */
const PILL_HEIGHT = 34;

type Tab = { name: string; href: Href; label: string; icon: IconName; iconActive: IconName };

/**
 * Le voci, in ordine. Sono dichiarate qui e non ricavate dallo stato del
 * navigatore perché la barra vive *fuori* da `<Tabs>`: deve stare sopra le
 * schermate, e da lì lo stato del navigatore non arriva.
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
    <View
      style={{
        backgroundColor: theme.colors.bg,
        paddingHorizontal: theme.floatInset,
        paddingTop: theme.floatInset,
        paddingBottom: Math.max(insets.bottom, theme.floatInset),
      }}>
      <Surface
        level="low"
        elevation="float"
        radius={theme.radius.xl}
        style={[styles.bar, { paddingVertical: theme.space.sm }]}>
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
                  { backgroundColor: isFocused ? theme.colors.accentGlow : 'transparent' },
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
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  /** La pastiglia dietro la voce attiva. */
  pill: {
    height: PILL_HEIGHT,
    minWidth: 64,
    borderRadius: capsule(PILL_HEIGHT),
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  label: { fontSize: 10, letterSpacing: 0.4 },
});

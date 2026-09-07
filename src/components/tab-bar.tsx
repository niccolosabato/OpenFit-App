/**
 * Tab bar dell'app.
 *
 * Scritta a mano invece di usare quella di sistema per due ragioni: deve
 * rispettare i token del tema (fondo carbone, accento configurabile) e ogni
 * voce deve essere alta almeno `theme.hit`, perché la si tocca anche a mani
 * sudate fra una serie e l'altra.
 *
 * Sta sopra il contenuto invece che nel flusso, così resta ferma mentre le
 * schermate scorrono.
 *
 * La pastiglia della voce attiva è **una sola e scivola**. Ce n'erano cinque,
 * una per voce, che si accendevano e si spegnevano: cambiare scheda sembrava
 * accendere una luce diversa, non spostarsi. Una che si muove dice che le
 * cinque schermate sono posti dello stesso piano.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { FloatingBand } from '@/components/ui/floating-band';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

import type { Href } from 'expo-router';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

/** Altezza della pastiglia che scivola dietro la voce attiva. */
const PILL_HEIGHT = 52;
/** Aria fra la pastiglia e i bordi della cella. */
const PILL_INSET = 4;

type Tab = { name: string; href: Href; label: string; icon: IconName; iconActive: IconName };

/**
 * Le voci, in ordine. Sono dichiarate qui e non ricavate dallo stato del
 * navigatore perché la barra vive *fuori* da `<Tabs>`: deve stare sopra le
 * schermate, e da lì lo stato del navigatore non arriva.
 * La rotta attiva si legge dai segmenti del router.
 */
const TABS: Tab[] = [
  { name: 'index', href: '/', label: 'Oggi', icon: 'lightning-bolt-outline', iconActive: 'lightning-bolt' },
  { name: 'routines', href: '/routines', label: 'Schede', icon: 'clipboard-text-outline', iconActive: 'clipboard-text' },
  { name: 'exercises', href: '/exercises', label: 'Esercizi', icon: 'dumbbell', iconActive: 'dumbbell' },
  { name: 'history', href: '/history', label: 'Storico', icon: 'calendar-blank-outline', iconActive: 'calendar-check' },
  { name: 'stats', href: '/stats', label: 'Statistiche', icon: 'chart-line-variant', iconActive: 'chart-line' },
];

export function TabBar() {
  const theme = useTheme();
  const segments = useSegments();
  const [width, setWidth] = useState(0);

  // Dentro `(tabs)` il secondo segmento è il nome della rotta; sulla schermata
  // iniziale non c'è e vale `index`.
  const current = segments[0] === '(tabs)' ? (segments[1] ?? 'index') : 'index';
  const index = Math.max(0, TABS.findIndex((t) => t.name === current));

  const cell = width > 0 ? width / TABS.length : 0;
  const offset = useSharedValue(0);
  const placed = useRef(false);

  // La prima volta la pastiglia deve trovarsi già sotto la voce giusta: farla
  // arrivare scivolando da sinistra all'apertura dell'app sarebbe un'animazione
  // che nessuno ha chiesto.
  useEffect(() => {
    if (cell === 0) return;
    const target = cell * index;
    if (placed.current) {
      offset.value = withSpring(target, theme.motion.spring);
    } else {
      placed.current = true;
      offset.value = target;
    }
  }, [cell, index, offset, theme.motion.spring]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    // Niente sfumatura: sopra la tab bar c'è quasi sempre un'altra banda — la
    // barra delle azioni, o quella dell'allenamento in corso — e fra due barre
    // opache una sfumatura è solo una fessura.
    <FloatingBand edge="bottom" fade={false} surfaceStyle={{ padding: PILL_INSET }}>
      <View style={styles.bar} onLayout={onLayout}>
        {cell > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              pill,
              styles.pill,
              {
                width: cell,
                height: PILL_HEIGHT,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colors.accentGlow,
                borderColor: theme.colors.accentEdge,
              },
            ]}
          />
        ) : null}

        {TABS.map((config) => (
          <TabItem
            key={config.name}
            config={config}
            focused={current === config.name}
            onPress={() => {
              if (current !== config.name) router.navigate(config.href);
            }}
          />
        ))}
      </View>
    </FloatingBand>
  );
}

/**
 * Una voce. L'icona cresce di un soffio quando diventa attiva: è il modo di
 * dire "sei qui" che non richiede di leggere niente.
 */
function TabItem({
  config,
  focused,
  onPress,
}: {
  config: Tab;
  focused: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, theme.motion.spring);
  }, [focused, scale, theme.motion.spring]);

  const glyph = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={config.label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        { height: PILL_HEIGHT, gap: 3 },
        pressed && styles.pressed,
      ]}>
      <Animated.View style={glyph}>
        <MaterialCommunityIcons
          name={focused ? config.iconActive : config.icon}
          size={23}
          color={focused ? theme.colors.accent : theme.colors.textFaint}
        />
      </Animated.View>
      <Text
        variant="label"
        weight={focused ? 'bold' : 'medium'}
        tone={focused ? 'accent' : 'faint'}
        style={styles.label}
        numberOfLines={1}>
        {config.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row' },
  pill: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  // Le etichette sono corte ma "Statistiche" no: senza una crenatura più
  // stretta del solito quella sola voce andava a capo.
  label: { fontSize: 10, letterSpacing: 0.2 },
});

/**
 * Scelta fra due o tre opzioni che si escludono: il periodo delle statistiche,
 * l'unità di misura.
 *
 * Non sono chip. Un chip è un filtro — se ne accendono più d'uno, o nessuno —
 * e usarli per una scelta obbligata faceva sembrare spegnibile qualcosa che
 * non lo è. Qui il cursore è uno solo e si sposta: si vede che le opzioni sono
 * posizioni della stessa cosa.
 */

import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { capsule, useTheme } from '@/theme';
import { Surface } from './surface';
import { Text } from './text';

const HEIGHT = 44;
/** Il cursore sta dentro la scanalatura, con un filo di aria intorno. */
const INSET = 4;

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);

  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const cell = width > 0 ? (width - INSET * 2) / options.length : 0;

  const offset = useSharedValue(0);
  const placed = useRef(false);
  const cursor = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));

  // Il cursore si sposta con una molla, ma la prima volta — appena la
  // larghezza è nota — deve trovarsi già al posto giusto, non arrivarci
  // scivolando da sinistra all'apertura della schermata.
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

  function onLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <Surface
      level="mid"
      radius={capsule(HEIGHT)}
      style={{ height: HEIGHT, padding: INSET }}>
      <View style={styles.row} onLayout={onLayout}>
        {width > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              cursor,
              styles.cursor,
              {
                width: cell,
                borderRadius: capsule(HEIGHT - INSET * 2),
                backgroundColor: theme.colors.surface4,
              },
            ]}
          />
        ) : null}

        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={styles.cell}>
              <Text
                variant="caption"
                weight="semibold"
                tone={selected ? 'default' : 'faint'}
                numberOfLines={1}
                style={styles.label}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row' },
  cursor: { position: 'absolute', top: 0, bottom: 0, left: 0 },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center' },
});

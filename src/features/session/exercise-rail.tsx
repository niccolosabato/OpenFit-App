/**
 * Striscia degli esercizi della sessione.
 *
 * Durante una seduta si passa di continuo dal primo esercizio al quinto e
 * ritorno: per una serie di richiami, per correggere un carico, per aggiungere
 * una serie a qualcosa che si è già fatto. Con una lista lunga significava
 * scorrere avanti e indietro per schermate intere, cercando a occhio il nome
 * giusto.
 *
 * Qui ogni esercizio è una pastiglia con quante serie sono fatte su quante:
 * un tocco e la lista salta lì. Sta agganciata sotto l'header e non scorre.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Surface } from '@/components/ui/surface';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/theme';

export type RailItem = {
  id: string;
  name: string;
  done: number;
  total: number;
};

export function ExerciseRail({
  items,
  activeIndex,
  onJump,
  onAdd,
}: {
  items: RailItem[];
  activeIndex: number;
  onJump: (index: number) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<number[]>([]);

  // La pastiglia attiva si porta in vista da sola: seguire l'allenamento non
  // deve costare anche uno scorrimento orizzontale a mano.
  useEffect(() => {
    const x = offsets.current[activeIndex];
    if (x === undefined) return;
    scrollRef.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [activeIndex]);

  if (items.length === 0) return null;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: theme.space.sm, paddingHorizontal: theme.space.lg }}>
      {items.map((item, index) => {
        const complete = item.total > 0 && item.done >= item.total;
        const active = index === activeIndex;

        return (
          <Pressable
            key={item.id}
            onPress={() => onJump(index)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${item.name}, ${item.done} serie su ${item.total}`}
            onLayout={(e) => {
              offsets.current[index] = e.nativeEvent.layout.x;
            }}>
            {({ pressed }) => (
              <Surface
                level="mid"
                radius={theme.radius.pill}
                tinted={active}
                pressed={pressed}
                style={[styles.pill, { paddingHorizontal: theme.space.md, gap: theme.space.sm }]}>
                <Text
                  variant="caption"
                  tone={active ? 'accent' : 'default'}
                  numberOfLines={1}
                  style={styles.name}>
                  {item.name}
                </Text>
                {complete ? (
                  <MaterialCommunityIcons name="check-circle" size={15} color={theme.colors.success} />
                ) : (
                  <Text variant="caption" tone="faint" numeric>
                    {item.done}/{item.total}
                  </Text>
                )}
              </Surface>
            )}
          </Pressable>
        );
      })}

      <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="Aggiungi esercizio">
        {({ pressed }) => (
          <Surface
            level="mid"
            radius={theme.radius.pill}
            pressed={pressed}
            style={[styles.pill, { paddingHorizontal: theme.space.md }]}>
            <MaterialCommunityIcons name="plus" size={18} color={theme.colors.accent} />
          </Surface>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pill: { minHeight: 40, flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '600', maxWidth: 140 },
});

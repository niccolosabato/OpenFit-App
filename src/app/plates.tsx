import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import type { PlateSpec } from '@/db/schema';
import { calculatePlates, DEFAULT_PLATE_INVENTORY } from '@/lib/plates';
import { formatNumber, formatWeight, fromKg, toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

/** Tagli che si trovano in una palestra commerciale, in chilogrammi. */
const COMMON_PLATES = [25, 20, 15, 10, 5, 2.5, 2, 1.25, 1, 0.5];

/** Bilancieri tipici: olimpico, femminile, EZ, trap bar. */
const COMMON_BARS = [20, 15, 10, 25, 7];

export default function PlatesScreen() {
  const theme = useTheme();
  const { settings, update } = useSettings();

  const inventory = settings.plateInventory.length
    ? settings.plateInventory
    : DEFAULT_PLATE_INVENTORY;

  const [barWeight, setBarWeight] = useState<number | null>(
    fromKg(settings.barWeight, settings.unit),
  );

  function countFor(weight: number): number {
    return inventory.find((p) => p.weight === weight)?.count ?? 0;
  }

  function setCount(weight: number, count: number): void {
    const next: PlateSpec[] = inventory.filter((p) => p.weight !== weight);
    if (count > 0) next.push({ weight, count });
    next.sort((a, b) => b.weight - a.weight);
    update({ plateInventory: next });
  }

  const maxLoad = inventory.reduce((sum, p) => sum + p.weight * p.count * 2, 0) + settings.barWeight;

  // Un esempio concreto vale più di una spiegazione: si mostra come verrebbe
  // caricato un peso comune con la dotazione dichiarata.
  const example = calculatePlates(100, settings.barWeight, inventory);

  return (
    <Screen padded={false}>
      <ScreenHeader title="Bilanciere e dischi" showBack />

      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.lg, paddingBottom: theme.space.xxxl }}>
        <Card>
          <View style={{ gap: theme.space.md }}>
            <Text variant="heading">Peso del bilanciere</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
              {COMMON_BARS.map((bar) => (
                <Chip
                  key={bar}
                  label={formatWeight(bar, settings.unit)}
                  compact
                  selected={Math.abs(settings.barWeight - bar) < 0.01}
                  onPress={() => {
                    update({ barWeight: bar });
                    setBarWeight(fromKg(bar, settings.unit));
                  }}
                />
              ))}
            </View>
            <NumberStepper
              label="Oppure indicane uno tuo"
              value={barWeight}
              onChange={(value) => {
                setBarWeight(value);
                if (value !== null) update({ barWeight: toKg(value, settings.unit) });
              }}
              step={WEIGHT_STEP[settings.unit]}
              min={0}
              suffix={UNIT_LABEL[settings.unit]}
            />
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space.md }}>
            <View>
              <Text variant="heading">Dischi per lato</Text>
              <Text variant="caption" tone="dim">
                Quanti ne hai a disposizione per un solo lato del bilanciere.
              </Text>
            </View>

            {COMMON_PLATES.map((plate) => (
              <View key={plate} style={styles.plateRow}>
                <Text variant="subtitle" numeric style={{ width: 70 }}>
                  {formatNumber(fromKg(plate, settings.unit))} {UNIT_LABEL[settings.unit]}
                </Text>
                <View style={{ flex: 1 }}>
                  <NumberStepper
                    value={countFor(plate)}
                    onChange={(count) => setCount(plate, Math.max(0, Math.round(count ?? 0)))}
                    step={1}
                    min={0}
                    max={12}
                  />
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <View style={{ gap: theme.space.sm }}>
            <Text variant="label" tone="dim">
              Con questa dotazione
            </Text>
            <Text variant="body">
              Carichi al massimo {formatWeight(maxLoad, settings.unit)}.
            </Text>
            <Text variant="caption" tone="dim">
              {example.isExact
                ? `Per ${formatWeight(100, settings.unit)}: ${example.perSide
                    .flatMap((p) => Array<number>(p.count).fill(p.weight))
                    .map((w) => formatNumber(fromKg(w, settings.unit)))
                    .join(' + ')} per lato.`
                : `Con questi dischi non arrivi esattamente a ${formatWeight(100, settings.unit)}.`}
            </Text>
          </View>
        </Card>

        <Button
          title="Ripristina la dotazione standard"
          variant="secondary"
          fullWidth
          onPress={() => update({ plateInventory: DEFAULT_PLATE_INVENTORY })}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  plateRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

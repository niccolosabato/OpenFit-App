import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { parseISO } from 'date-fns';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { LineChart } from '@/components/charts/line-chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { bodyMeasurementsQuery, deleteMeasurement, saveMeasurement } from '@/db/queries/body';
import { formatDayKey, formatSessionDate } from '@/lib/format';
import { formatNumber, formatWeight, fromKg, toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

/** Le circonferenze si misurano in centimetri a prescindere dall'unità dei carichi. */
const GIRTHS = [
  { key: 'neck', label: 'Collo' },
  { key: 'chest', label: 'Petto' },
  { key: 'waist', label: 'Vita' },
  { key: 'hips', label: 'Fianchi' },
  { key: 'armLeft', label: 'Braccio sx' },
  { key: 'armRight', label: 'Braccio dx' },
  { key: 'thighLeft', label: 'Coscia sx' },
  { key: 'thighRight', label: 'Coscia dx' },
  { key: 'calf', label: 'Polpaccio' },
] as const;

export default function BodyScreen() {
  const theme = useTheme();
  const { settings } = useSettings();
  const { data } = useLiveQuery(bodyMeasurementsQuery());
  const measurements = data ?? [];

  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [girths, setGirths] = useState<Record<string, number | null>>({});

  const latest = measurements[0];

  // Il grafico vuole l'ordine cronologico; la lista lo vuole al contrario.
  const weightPoints = [...measurements]
    .reverse()
    .filter((m) => m.weight !== null)
    .map((m) => ({ x: parseISO(m.measuredOn).getTime(), y: m.weight! }));

  function openEditor() {
    setWeight(latest?.weight != null ? fromKg(latest.weight, settings.unit) : null);
    setBodyFat(latest?.bodyFat ?? null);
    setGirths(
      Object.fromEntries(GIRTHS.map((g) => [g.key, (latest?.[g.key] as number | null) ?? null])),
    );
    setOpen(true);
  }

  function save() {
    saveMeasurement(formatDayKey(new Date()), {
      weight: weight === null ? null : toKg(weight, settings.unit),
      bodyFat,
      ...Object.fromEntries(GIRTHS.map((g) => [g.key, girths[g.key] ?? null])),
    });
    setOpen(false);
  }

  function confirmDelete(id: string) {
    Alert.alert('Eliminare la misurazione?', undefined, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => deleteMeasurement(id) },
    ]);
  }

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Peso e misure"
        showBack
        actions={[{ icon: 'plus', label: 'Registra', onPress: openEditor }]}
      />

      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.md, paddingBottom: theme.space.xxxl }}>
        <Card>
          <View style={{ gap: theme.space.md }}>
            <View>
              <Text variant="heading">Peso corporeo</Text>
              <Text variant="caption" tone="dim">
                {latest
                  ? `Ultima misura ${formatSessionDate(parseISO(latest.measuredOn))}`
                  : 'Nessuna misura registrata'}
              </Text>
            </View>
            <LineChart
              data={weightPoints}
              formatValue={(v) => formatWeight(v, settings.unit)}
              formatX={(x) => formatSessionDate(new Date(x))}
              emptyLabel="Servono almeno due pesate per vedere un andamento."
            />
          </View>
        </Card>

        {measurements.length === 0 ? (
          <Button title="Registra la prima misurazione" fullWidth onPress={openEditor} />
        ) : (
          measurements.map((m) => (
            <Card key={m.id} onPress={() => confirmDelete(m.id)}>
              <View style={styles.row}>
                <Text variant="subtitle" style={{ flex: 1 }}>
                  {formatSessionDate(parseISO(m.measuredOn))}
                </Text>
                <Text variant="subtitle" numeric>
                  {m.weight !== null ? formatWeight(m.weight, settings.unit) : '—'}
                </Text>
              </View>
              <Text variant="caption" tone="faint" style={{ marginTop: 4 }}>
                {[
                  m.bodyFat !== null ? `${formatNumber(m.bodyFat)}% grasso` : null,
                  ...GIRTHS.map((g) =>
                    m[g.key] !== null ? `${g.label} ${formatNumber(m[g.key] as number)} cm` : null,
                  ),
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Solo il peso'}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Misurazione di oggi">
        <NumberStepper
          label="Peso"
          value={weight}
          onChange={setWeight}
          step={WEIGHT_STEP[settings.unit] * 0.2}
          min={0}
          suffix={UNIT_LABEL[settings.unit]}
          allowEmpty
        />
        <NumberStepper
          label="Massa grassa"
          value={bodyFat}
          onChange={setBodyFat}
          step={0.5}
          min={0}
          max={70}
          suffix="%"
          allowEmpty
        />

        <Text variant="label" tone="dim">
          Circonferenze (cm)
        </Text>
        {GIRTHS.map((girth) => (
          <NumberStepper
            key={girth.key}
            label={girth.label}
            value={girths[girth.key] ?? null}
            onChange={(value) => setGirths((prev) => ({ ...prev, [girth.key]: value }))}
            step={0.5}
            min={0}
            max={300}
            suffix="cm"
            allowEmpty
          />
        ))}

        <Button title="Salva" fullWidth onPress={save} />
        <SheetAction label="Annulla" onPress={() => setOpen(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

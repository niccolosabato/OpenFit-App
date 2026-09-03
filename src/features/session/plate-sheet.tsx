/**
 * Calcolatore dei dischi.
 *
 * Risponde alla domanda che ci si fa davanti al rack — *cosa carico per lato?*
 * — e, quando il numero non è ottenibile con i dischi che si hanno, dice quali
 * sono i due pesi caricabili più vicini invece di lasciare l'utente davanti a
 * un target impossibile.
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NumberStepper } from '@/components/ui/number-stepper';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { calculatePlates, nearestLoadable } from '@/lib/plates';
import { formatWeight, fromKg, toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export function PlateSheet({
  targetWeight,
  onClose,
}: {
  /** Carico in kg da cui partire; `null` chiude il foglio. */
  targetWeight: number | null;
  onClose: () => void;
}) {
  const theme = useTheme();
  const { settings } = useSettings();
  const [display, setDisplay] = useState<number | null>(null);

  useEffect(() => {
    if (targetWeight === null) return;
    setDisplay(fromKg(targetWeight, settings.unit));
  }, [targetWeight, settings.unit]);

  const targetKg = display === null ? 0 : toKg(display, settings.unit);
  const breakdown = calculatePlates(targetKg, settings.barWeight, settings.plateInventory);
  const nearest = nearestLoadable(targetKg, settings.barWeight, settings.plateInventory);

  return (
    <Sheet
      visible={targetWeight !== null}
      onClose={onClose}
      title="Dischi per lato"
      subtitle={`Bilanciere da ${formatWeight(settings.barWeight, settings.unit)}`}>
      <NumberStepper
        label="Carico obiettivo"
        value={display}
        onChange={setDisplay}
        step={WEIGHT_STEP[settings.unit] * 5}
        min={0}
        suffix={UNIT_LABEL[settings.unit]}
      />

      {breakdown.belowBar ? (
        <Text variant="caption" tone="dim">
          Sotto il peso del solo bilanciere.
        </Text>
      ) : breakdown.perSide.length === 0 ? (
        <Text variant="caption" tone="dim">
          Bilanciere scarico.
        </Text>
      ) : (
        <View style={[styles.plates, { gap: theme.space.sm }]}>
          {breakdown.perSide.flatMap((plate) =>
            Array.from({ length: plate.count }, (_, i) => (
              <View
                key={`${plate.weight}-${i}`}
                style={[
                  styles.plate,
                  {
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.borderStrong,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.sm,
                  },
                ]}>
                <Text variant="heading" numeric>
                  {formatWeight(plate.weight, settings.unit).replace(` ${UNIT_LABEL[settings.unit]}`, '')}
                </Text>
              </View>
            )),
          )}
        </View>
      )}

      {!breakdown.isExact ? (
        <Text variant="caption" tone="warning">
          {nearest.above
            ? `Con i tuoi dischi non fai ${formatWeight(targetKg, settings.unit)}: puoi mettere ${formatWeight(nearest.below, settings.unit)} o ${formatWeight(nearest.above, settings.unit)}.`
            : `I dischi disponibili arrivano al massimo a ${formatWeight(nearest.below, settings.unit)}.`}
        </Text>
      ) : null}

      <Text variant="caption" tone="faint">
        La dotazione di dischi si imposta nel Profilo.
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  plates: { flexDirection: 'row', flexWrap: 'wrap' },
  plate: { borderWidth: StyleSheet.hairlineWidth * 2, minWidth: 54, alignItems: 'center' },
});

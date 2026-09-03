/**
 * Foglio di modifica di una serie *prevista* (dentro una scheda).
 *
 * Quali campi compaiono dipende dal `trackingType` dell'esercizio: a un plank
 * non si chiedono le ripetizioni, a una trazione assistita il carico è
 * negativo. Chiedere sempre tutto renderebbe il foglio illeggibile.
 */

import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { NumberStepper } from '@/components/ui/number-stepper';
import { Sheet, SheetAction } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import {
  SET_TYPE_LABELS,
  TECHNIQUES,
  TECHNIQUE_DESCRIPTIONS,
  TECHNIQUE_LABELS,
  TOP_LEVEL_SET_TYPES,
  usesDuration,
  usesReps,
  usesWeight,
  type SetType,
  type Technique,
  type TrackingType,
} from '@/db/enums';
import type { RoutineSet } from '@/db/schema';
import { fromKg, toKg, UNIT_LABEL, WEIGHT_STEP } from '@/lib/units';
import { useSettings } from '@/store/settings';
import { useTheme } from '@/theme';

export function RoutineSetEditor({
  set,
  tracking,
  onClose,
  onSave,
  onDelete,
}: {
  set: RoutineSet | null;
  tracking: TrackingType;
  onClose: () => void;
  onSave: (patch: Partial<RoutineSet>) => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const { settings } = useSettings();

  const [setType, setSetType] = useState<SetType>('working');
  const [technique, setTechnique] = useState<Technique | null>(null);
  const [repsMin, setRepsMin] = useState<number | null>(8);
  const [repsMax, setRepsMax] = useState<number | null>(10);
  const [weight, setWeight] = useState<number | null>(null);
  const [effort, setEffort] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Il foglio è montato sempre: si ricarica dai dati a ogni apertura, altrimenti
  // mostrerebbe la serie precedente.
  useEffect(() => {
    if (!set) return;
    setSetType(set.setType);
    setTechnique(set.technique);
    setRepsMin(set.targetRepsMin);
    setRepsMax(set.targetRepsMax);
    setWeight(set.targetWeight === null ? null : fromKg(set.targetWeight, settings.unit));
    setEffort(settings.effortScale === 'rir' ? set.targetRir : set.targetRpe);
    setDuration(set.targetDurationSeconds);
  }, [set, settings.unit, settings.effortScale]);

  function save() {
    onSave({
      setType,
      technique,
      targetRepsMin: repsMin,
      targetRepsMax: repsMax,
      targetWeight: weight === null ? null : toKg(weight, settings.unit),
      targetRpe: settings.effortScale === 'rir' ? null : effort,
      targetRir: settings.effortScale === 'rir' ? effort : null,
      targetDurationSeconds: duration,
    });
    onClose();
  }

  const usingRir = settings.effortScale === 'rir';

  return (
    <Sheet visible={set !== null} onClose={onClose} title="Serie prevista">
      <View style={{ gap: theme.space.sm }}>
        <Text variant="label" tone="dim">
          Tipo di serie
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {TOP_LEVEL_SET_TYPES.map((type) => (
            <Chip
              key={type}
              label={SET_TYPE_LABELS[type]}
              compact
              selected={setType === type}
              onPress={() => setSetType(type)}
            />
          ))}
        </View>
      </View>

      {usesReps(tracking) ? (
        <View style={{ flexDirection: 'row', gap: theme.space.md }}>
          <View style={{ flex: 1 }}>
            <NumberStepper label="Ripetizioni da" value={repsMin} onChange={setRepsMin} min={1} max={100} />
          </View>
          <View style={{ flex: 1 }}>
            <NumberStepper label="a" value={repsMax} onChange={setRepsMax} min={1} max={100} />
          </View>
        </View>
      ) : null}

      {usesDuration(tracking) ? (
        <NumberStepper
          label="Durata"
          value={duration}
          onChange={setDuration}
          step={5}
          min={0}
          suffix="s"
          allowEmpty
        />
      ) : null}

      {usesWeight(tracking) ? (
        <NumberStepper
          label="Carico previsto"
          value={weight}
          onChange={setWeight}
          step={WEIGHT_STEP[settings.unit]}
          min={-200}
          suffix={UNIT_LABEL[settings.unit]}
          allowEmpty
          placeholder="libero"
        />
      ) : null}

      {settings.effortScale !== 'none' ? (
        <NumberStepper
          label={usingRir ? 'Ripetizioni in riserva' : 'RPE'}
          value={effort}
          onChange={setEffort}
          step={usingRir ? 1 : 0.5}
          min={0}
          max={usingRir ? 10 : 10}
          allowEmpty
          placeholder="—"
        />
      ) : null}

      <View style={{ gap: theme.space.sm }}>
        <Text variant="label" tone="dim">
          Tecnica di intensificazione
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          <Chip label="Nessuna" compact selected={technique === null} onPress={() => setTechnique(null)} />
          {TECHNIQUES.map((t) => (
            <Chip
              key={t}
              label={TECHNIQUE_LABELS[t]}
              compact
              selected={technique === t}
              onPress={() => setTechnique(t)}
            />
          ))}
        </View>
        {technique ? (
          <Text variant="caption" tone="faint">
            {TECHNIQUE_DESCRIPTIONS[technique]}
          </Text>
        ) : null}
      </View>

      <Button title="Salva" onPress={save} fullWidth />
      <SheetAction label="Elimina serie" destructive onPress={onDelete} />
    </Sheet>
  );
}

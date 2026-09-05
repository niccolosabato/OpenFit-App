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
  EFFORT_SCALES,
  EFFORT_SCALE_SHORT,
  SET_TYPE_LABELS,
  TECHNIQUES,
  TECHNIQUE_DESCRIPTIONS,
  TECHNIQUE_LABELS,
  TOP_LEVEL_SET_TYPES,
  usesDuration,
  usesReps,
  usesWeight,
  type EffortScale,
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
  const [scale, setScale] = useState<EffortScale>('rpe');
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

    // La scala è quella con cui la serie è già scritta: la colonna valorizzata
    // dice da sé se è un RPE o un RIR. Solo per una serie ancora vuota si parte
    // dalla preferenza generale.
    const written: EffortScale | null =
      set.targetRir !== null ? 'rir' : set.targetRpe !== null ? 'rpe' : null;
    setScale(written ?? settings.effortScale);
    setEffort(set.targetRir ?? set.targetRpe);

    setDuration(set.targetDurationSeconds);
  }, [set, settings.unit, settings.effortScale]);

  function save() {
    onSave({
      setType,
      technique,
      targetRepsMin: repsMin,
      targetRepsMax: repsMax,
      targetWeight: weight === null ? null : toKg(weight, settings.unit),
      // Una colonna sola per volta: è quella valorizzata a dire con che scala
      // la serie è stata pensata.
      targetRpe: scale === 'rpe' ? effort : null,
      targetRir: scale === 'rir' ? (effort === null ? null : Math.round(effort)) : null,
      targetDurationSeconds: duration,
    });
    onClose();
  }

  return (
    <Sheet
      visible={set !== null}
      onClose={onClose}
      title="Serie prevista"
      // Il foglio scorre: senza un piede fisso il "Salva" va inseguito.
      footer={<Button title="Salva" onPress={save} size="lg" fullWidth />}>
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

      {/* La scala si sceglie qui, serie per serie: una scheda mescola le due
          cose — il riscaldamento a sensazione in RIR, la top set a RPE — e
          costringere tutta l'app a una sola scala obbligava a cambiare
          impostazione a metà scheda. Il valore vive comunque in due colonne
          separate, quindi passare da una scala all'altra non lo converte:
          `2 RIR` non diventa `@8` da solo. */}
      <View style={{ gap: theme.space.sm }}>
        <Text variant="label" tone="dim">
          Sforzo previsto
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
          {EFFORT_SCALES.map((option) => (
            <Chip
              key={option}
              label={EFFORT_SCALE_SHORT[option]}
              compact
              selected={scale === option}
              onPress={() => {
                setScale(option);
                if (option === 'none') setEffort(null);
              }}
            />
          ))}
        </View>
        {scale !== 'none' ? (
          <NumberStepper
            value={effort}
            onChange={setEffort}
            step={scale === 'rir' ? 1 : 0.5}
            min={0}
            max={10}
            allowEmpty
            placeholder="—"
          />
        ) : null}
      </View>

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

      <SheetAction label="Elimina serie" destructive onPress={onDelete} />
    </Sheet>
  );
}

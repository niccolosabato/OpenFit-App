import { useState } from 'react';
import { View } from 'react-native';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { notify } from '@/components/ui/confirm';
import { OptionField, TextField } from '@/components/ui/field';
import { Screen, ScreenScroll } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import {
  EQUIPMENT,
  EQUIPMENT_LABELS,
  MECHANIC_LABELS,
  MUSCLES,
  MUSCLE_LABELS,
  TRACKING_TYPES,
  TRACKING_TYPE_LABELS,
  type Equipment,
  type Mechanic,
  type Muscle,
  type TrackingType,
} from '@/db/enums';
import type { Exercise } from '@/db/schema';
import { useTheme } from '@/theme';

const MECHANICS = ['compound', 'isolation'] as const;

/**
 * Quello che il modulo sa scrivere, già in forma di testo.
 *
 * Il recupero è una stringa perché è così che vive dentro un campo di testo:
 * la conversione a numero avviene una volta sola, al salvataggio. Tenerla
 * qui invece che nello stato del componente permette di riusare lo stesso
 * modulo per creare e per modificare.
 */
export type ExerciseDraft = {
  name: string;
  aliases: string;
  primaryMuscle: Muscle;
  equipment: Equipment;
  mechanic: Mechanic;
  trackingType: TrackingType;
  rest: string;
  instructions: string;
};

export const EMPTY_EXERCISE_DRAFT: ExerciseDraft = {
  name: '',
  aliases: '',
  primaryMuscle: 'chest',
  equipment: 'barbell',
  mechanic: 'isolation',
  trackingType: 'weight_reps',
  rest: '90',
  instructions: '',
};

export function exerciseToDraft(exercise: Exercise): ExerciseDraft {
  return {
    name: exercise.name,
    aliases: exercise.aliases ?? '',
    primaryMuscle: exercise.primaryMuscle,
    equipment: exercise.equipment,
    mechanic: exercise.mechanic,
    trackingType: exercise.trackingType,
    rest: exercise.defaultRestSeconds != null ? String(exercise.defaultRestSeconds) : '',
    instructions: exercise.instructions ?? '',
  };
}

/** I valori pronti per il database, con le stringhe vuote già normalizzate. */
export type ExerciseFormValues = {
  name: string;
  aliases: string | null;
  primaryMuscle: Muscle;
  equipment: Equipment;
  mechanic: Mechanic;
  trackingType: TrackingType;
  instructions: string | null;
  defaultRestSeconds: number | null;
};

/**
 * Modulo di un esercizio, condiviso fra creazione e modifica.
 *
 * È lo stesso elenco di campi in entrambi i casi: se le due schermate
 * divergessero, un esercizio nuovo e uno modificato potrebbero finire con
 * campi diversi senza che nulla lo segnali.
 */
export function ExerciseForm({
  title,
  submitLabel,
  footnote,
  initial,
  onSubmit,
}: {
  title: string;
  submitLabel: string;
  footnote?: string;
  initial: ExerciseDraft;
  onSubmit: (values: ExerciseFormValues) => void;
}) {
  const theme = useTheme();

  const [name, setName] = useState(initial.name);
  const [aliases, setAliases] = useState(initial.aliases);
  const [primaryMuscle, setPrimaryMuscle] = useState<Muscle>(initial.primaryMuscle);
  const [equipment, setEquipment] = useState<Equipment>(initial.equipment);
  const [mechanic, setMechanic] = useState<Mechanic>(initial.mechanic);
  const [trackingType, setTrackingType] = useState<TrackingType>(initial.trackingType);
  const [rest, setRest] = useState(initial.rest);
  const [instructions, setInstructions] = useState(initial.instructions);

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      notify('Manca il nome', 'Dai un nome all’esercizio per salvarlo.');
      return;
    }

    const restSeconds = Number.parseInt(rest, 10);

    onSubmit({
      name: trimmed,
      aliases: aliases.trim() || null,
      primaryMuscle,
      equipment,
      mechanic,
      trackingType,
      instructions: instructions.trim() || null,
      defaultRestSeconds: Number.isFinite(restSeconds) ? restSeconds : null,
    });
  }

  return (
    <Screen
      padded={false}
      header={<ScreenHeader title={title} showBack />}
      // "Salva" era l'ultimo elemento dopo sette campi: con la tastiera aperta
      // andava chiusa e poi inseguita fino in fondo allo scroll.
      actionBar={
        <ActionBar>
          <View style={{ flex: 1 }}>
            <Button title={submitLabel} onPress={save} fullWidth size="lg" />
          </View>
        </ActionBar>
      }>
      <ScreenScroll gap={theme.space.xl} keyboardShouldPersistTaps="handled">
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Es. Panca inclinata con manubri"
          autoFocus
        />

        <TextField
          label="Altri nomi"
          value={aliases}
          onChangeText={setAliases}
          placeholder="incline dumbbell press; panca 30 gradi"
          hint="Separati da punto e virgola. Servono solo alla ricerca."
        />

        <OptionField
          label="Muscolo principale"
          value={primaryMuscle}
          options={MUSCLES}
          labels={MUSCLE_LABELS}
          onChange={setPrimaryMuscle}
        />

        <OptionField
          label="Attrezzo"
          value={equipment}
          options={EQUIPMENT}
          labels={EQUIPMENT_LABELS}
          onChange={setEquipment}
        />

        <OptionField
          label="Tipo di movimento"
          value={mechanic}
          options={MECHANICS}
          labels={MECHANIC_LABELS}
          onChange={setMechanic}
        />

        <OptionField
          label="Come si misura"
          value={trackingType}
          options={TRACKING_TYPES}
          labels={TRACKING_TYPE_LABELS}
          onChange={setTrackingType}
          hint="Decide quali campi ti chiederà la sessione: carico, ripetizioni, tempo o distanza."
        />

        <TextField
          label="Recupero predefinito (secondi)"
          value={rest}
          onChangeText={setRest}
          keyboardType="number-pad"
          placeholder="90"
        />

        <TextField
          label="Note tecniche"
          value={instructions}
          onChangeText={setInstructions}
          placeholder="Setup, accorgimenti, range di movimento…"
          multiline
        />

        {footnote ? (
          <Text variant="caption" tone="faint" style={{ textAlign: 'center' }}>
            {footnote}
          </Text>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

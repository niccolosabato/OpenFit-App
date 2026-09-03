import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { OptionField, TextField } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
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
import { createCustomExercise } from '@/db/queries/exercises';
import { useTheme } from '@/theme';

const MECHANICS = ['compound', 'isolation'] as const;

export default function NewExerciseScreen() {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [primaryMuscle, setPrimaryMuscle] = useState<Muscle>('chest');
  const [equipment, setEquipment] = useState<Equipment>('barbell');
  const [mechanic, setMechanic] = useState<Mechanic>('isolation');
  const [trackingType, setTrackingType] = useState<TrackingType>('weight_reps');
  const [rest, setRest] = useState('90');
  const [instructions, setInstructions] = useState('');

  function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Manca il nome', 'Dai un nome all’esercizio per salvarlo.');
      return;
    }

    const restSeconds = Number.parseInt(rest, 10);

    const id = createCustomExercise({
      name: trimmed,
      aliases: aliases.trim() || null,
      primaryMuscle,
      secondaryMuscles: [],
      equipment,
      mechanic,
      trackingType,
      instructions: instructions.trim() || null,
      defaultRestSeconds: Number.isFinite(restSeconds) ? restSeconds : null,
    });

    router.replace({ pathname: '/exercise/[id]', params: { id } });
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Nuovo esercizio" showBack />
      <ScrollView
        contentContainerStyle={{ padding: theme.space.lg, gap: theme.space.xl, paddingBottom: theme.space.xxxl }}
        keyboardShouldPersistTaps="handled">
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

        <View style={{ gap: theme.space.sm }}>
          <Button title="Salva esercizio" onPress={save} fullWidth size="lg" />
          <Text variant="caption" tone="faint" style={{ textAlign: 'center' }}>
            Gli esercizi personalizzati non vengono mai sovrascritti dagli aggiornamenti.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

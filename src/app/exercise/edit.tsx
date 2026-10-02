import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';

import { ExerciseForm, exerciseToDraft } from '@/components/exercise/exercise-form';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { getExercise, updateExercise } from '@/db/queries/exercises';
import { useTheme } from '@/theme';

export default function EditExerciseScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Lettura sola una volta: i valori iniziali del modulo non devono cambiare
  // sotto le dita mentre si scrive. Dopo il salvataggio si esce, e il dettaglio
  // si aggiorna da sé perché resta in ascolto sul database.
  const exercise = useMemo(() => getExercise(id), [id]);

  if (!exercise) {
    return (
      <Screen padded={false} header={<ScreenHeader title="Esercizio" showBack />}>
        <Text variant="caption" tone="dim" style={{ padding: theme.space.lg }}>
          Esercizio non trovato.
        </Text>
      </Screen>
    );
  }

  return (
    <ExerciseForm
      title="Modifica esercizio"
      submitLabel="Salva modifiche"
      // Vale anche per gli esercizi della libreria: il seed aggiunge solo quelli
      // che mancano e non riscrive mai quelli già presenti.
      footnote="Le modifiche restano: gli aggiornamenti dell’app non le sovrascrivono."
      initial={exerciseToDraft(exercise)}
      onSubmit={(values) => {
        // Solo i campi del modulo: `isCustom`, `isFavorite`, `isUnilateral` e i
        // muscoli secondari restano quelli che erano.
        updateExercise(exercise.id, values);
        router.back();
      }}
    />
  );
}
